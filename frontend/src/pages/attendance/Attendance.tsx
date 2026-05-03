import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Camera, Download, MapPin, Search, ShieldCheck, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { Drawer } from '../../components/common/Drawer';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { downloadCsv } from '../../lib/csv';
import {
  getAttendanceRecords,
  getEmployeeDepartments,
} from '../../services/modules/admin';
import api from '../../services/api';
import type { AttendanceRecord } from '../../types/admin';

export default function Attendance() {
  const { role, user } = useAuth();
  return role === 'admin' ? <AdminAttendance /> : <EmployeeAttendance user={user} />;
}

function EmployeeAttendance({
  user,
}: {
  user: { email?: string } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keep the video element's srcObject in sync with stream state.
  // Using a useEffect (not just startCamera) ensures the ref is set
  // even after React re-renders.
  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
    } catch {
      toast.error('Could not access camera. Please allow camera permission and try again.');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  };

  const captureFrameAsBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return resolve(null);

      // Wait until the video has actual frame data
      const doCapture = () => {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      };

      if (video.readyState >= 2 && video.videoWidth > 0) {
        // Video already has frame data — capture immediately
        doCapture();
      } else {
        // Wait for the video to load its first frame
        const onReady = () => {
          video.removeEventListener('loadeddata', onReady);
          video.removeEventListener('canplay', onReady);
          // Small delay so the browser renders the first frame
          setTimeout(doCapture, 100);
        };
        video.addEventListener('loadeddata', onReady);
        video.addEventListener('canplay', onReady);
      }
    });
  };

  const markAttendance = () => {
    if (!stream || !videoRef.current) {
      toast.error('Camera is not active. Please start the camera first.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const blob = await captureFrameAsBlob();
          if (!blob) {
            toast.error('Could not capture attendance photo. Please try again.');
            setLoading(false);
            return;
          }

          const formData = new FormData();
          formData.append('photo', blob, 'capture.jpg');
          formData.append('latitude', latitude.toString());
          formData.append('longitude', longitude.toString());

          const response = await api.post('/attendance/mark', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success(`Attendance marked: ${response.data.status}`);
          stopCamera();
        } catch (error: any) {
          toast.error(error.response?.data?.detail || 'Failed to mark attendance.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Could not get location. Please enable GPS and try again.');
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Check-in Studio"
        title="Capture your attendance proof"
        description="Start the camera, verify your location, and submit a live check-in from the approved office perimeter."
        stats={[
          { label: 'Today', value: format(new Date(), 'EEE, MMM d') },
          { label: 'Account', value: user?.email ?? 'Workspace user' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          {!stream ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-[28px] border border-dashed border-cyan-300/35 bg-white/35 px-6 py-10 text-center dark:bg-white/5">
              <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-600 dark:text-cyan-300">
                <Camera className="h-10 w-10" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-slate-950 dark:text-white">
                Start your live camera feed
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300/62">
                Make sure you are inside the allowed office radius and in a well-lit space before you continue.
              </p>
              <button type="button" onClick={startCamera} className="glass-button-primary mt-8">
                <Video className="h-4 w-4" />
                Start camera
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[28px] border border-white/55 bg-slate-950 shadow-[0_25px_60px_rgba(15,23,42,0.25)] dark:border-white/10">
                <video ref={videoRef} autoPlay playsInline className="aspect-video h-full w-full object-cover" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.85)]" />
                  Live capture active
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={markAttendance}
                  disabled={loading}
                  className="glass-button-primary w-full disabled:opacity-50"
                >
                  <MapPin className="h-5 w-5" />
                  {loading ? 'Verifying...' : 'Check in'}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={loading}
                  className="glass-button-secondary w-full disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel glow="emerald" contentClassName="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Check-in checklist</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300/62">
                  <div>1. Allow camera access and keep your face visible.</div>
                  <div>2. Turn on location services for precise office verification.</div>
                  <div>3. Submit once the preview is clear and stable.</div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel glow="amber" contentClassName="p-6">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Why this flow matters</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300/62">
              GeoVerify combines live location and photo proof to reduce proxy attendance and keep records clean for review.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function AttendanceDetails({ record }: { record: AttendanceRecord }) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/55 bg-white/65 dark:border-white/10 dark:bg-white/5">
        <img src={record.photo_url} alt={`Attendance proof for ${record.employees?.name ?? 'employee'}`} className="h-72 w-full object-cover" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/55 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Employee</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {record.employees?.name}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-300/55">{record.employees?.email}</div>
        </div>

        <div className="rounded-[24px] border border-white/55 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Status</div>
          <div className="mt-3">
            <StatusBadge label={record.status} />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/55 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Department</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {record.employees?.department || 'General'}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-300/55">
            {record.employees?.job_title || 'No job title'}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/55 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Timestamp</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {format(new Date(record.created_at), 'EEE, MMM d')}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-300/55">
            {format(new Date(record.created_at), 'hh:mm a')}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/55 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm text-slate-500 dark:text-slate-300/45">Coordinates</div>
        <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
          {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
        </div>
        <a
          href={`https://maps.google.com/?q=${record.latitude},${record.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-300"
        >
          Open in Maps
        </a>
      </div>
    </div>
  );
}

function AdminAttendance() {
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [department, setDepartment] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const deferredSearch = useDeferredValue(search);

  useRealtimeInvalidation(
    'admin-attendance-live',
    [{ table: 'attendance', queryKeys: [['admin-attendance'], ['admin-dashboard'], ['reports']] }],
    true,
  );

  const { data: departments = [] } = useQuery({
    queryKey: ['employee-departments'],
    queryFn: getEmployeeDepartments,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['admin-attendance', dateFrom, dateTo, department, deferredSearch],
    queryFn: () => getAttendanceRecords({ dateFrom, dateTo, department, search: deferredSearch }),
  });

  const lateCount = records.filter((record) => record.status === 'Late').length;
  const departmentsCovered = new Set(records.map((record) => record.employees?.department || 'General')).size;

  const exportCsv = () => {
    if (records.length === 0) {
      toast.error('No attendance data to export.');
      return;
    }

    downloadCsv(
      `attendance-records-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      [
        ['Employee', 'Email', 'Department', 'Date', 'Time', 'Status', 'Latitude', 'Longitude', 'Photo URL'],
        ...records.map((record) => [
          record.employees?.name ?? 'Unknown',
          record.employees?.email ?? '',
          record.employees?.department ?? 'General',
          record.date,
          format(new Date(record.created_at), 'hh:mm a'),
          record.status,
          record.latitude.toString(),
          record.longitude.toString(),
          record.photo_url,
        ]),
      ],
    );

    toast.success('Attendance CSV exported.');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Attendance Matrix"
        title="Monitor every check-in"
        description="Filter records by date range and department, open proof details in a drawer, and export a clean CSV for audit review."
        stats={[
          { label: 'Visible records', value: `${records.length}` },
          { label: 'Late arrivals', value: `${lateCount}` },
        ]}
        actions={
          <button type="button" onClick={exportCsv} className="glass-button-primary">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
        <GlassPanel glow="blue" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Records in view</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{records.length}</div>
        </GlassPanel>
        <GlassPanel glow="amber" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Late arrivals</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{lateCount}</div>
        </GlassPanel>
        <GlassPanel glow="emerald" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Departments covered</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{departmentsCovered}</div>
        </GlassPanel>
        <GlassPanel glow="blue" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Range</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {format(new Date(dateFrom), 'dd MMM')} - {format(new Date(dateTo), 'dd MMM')}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel glow="blue" contentClassName="p-5">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_repeat(3,minmax(0,0.7fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="Search employee or title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="glass-input pl-10"
            />
          </div>

          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="glass-input" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="glass-input" />

          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="glass-select">
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </GlassPanel>

      <GlassPanel glow="emerald" contentClassName="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/55 bg-white/60 dark:border-white/8 dark:bg-white/5">
              <tr className="text-slate-500 dark:text-slate-300/45">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/45 dark:divide-white/6">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="px-6 py-4">
                      <Skeleton className="h-14 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState
                      title="No attendance records found"
                      description="Try widening the date range or switching the department filter."
                    />
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="transition hover:bg-white/35 dark:hover:bg-white/4">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-950 dark:text-white">{record.employees?.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300/45">{record.employees?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {record.employees?.department || 'General'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300/45">
                        {record.employees?.job_title || 'No job title'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {format(new Date(record.date), 'EEE, MMM d')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300/45">
                        {format(new Date(record.created_at), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge label={record.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-300/55">
                      {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="glass-button-secondary px-4 py-2"
                      >
                        View proof
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <Drawer
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.employees?.name || 'Attendance details'}
        description="Review the attendance proof, location data, and submission metadata."
      >
        {selectedRecord ? <AttendanceDetails record={selectedRecord} /> : null}
      </Drawer>
    </div>
  );
}
