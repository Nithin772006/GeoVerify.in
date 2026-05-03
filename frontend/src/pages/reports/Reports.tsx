import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/cards/StatCard';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { downloadCsv } from '../../lib/csv';
import { getReportsData } from '../../services/modules/admin';

const PIE_COLORS = ['#38bdf8', '#10b981', '#f59e0b'];

export default function Reports() {
  const [dateRange, setDateRange] = useState(30);

  useRealtimeInvalidation(
    'reports-live',
    [
      { table: 'attendance', queryKeys: [['reports'], ['admin-dashboard']] },
      { table: 'leave_requests', queryKeys: [['reports'], ['admin-dashboard']] },
      { table: 'employees', queryKeys: [['reports'], ['admin-dashboard']] },
    ],
    true,
  );

  const { data, isLoading } = useQuery({
    queryKey: ['reports', dateRange],
    queryFn: () => getReportsData(dateRange),
  });

  const exportCsv = () => {
    if (!data?.attendanceTrend.length) {
      toast.error('No report data to export.');
      return;
    }

    downloadCsv(
      `attendance-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      [
        ['Date', 'Checked In', 'Late'],
        ...data.attendanceTrend.map((entry) => [entry.date, String(entry.checkedIn), String(entry.late)]),
      ],
    );
    toast.success('Analytics CSV exported.');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics Studio"
        title="Decode attendance patterns"
        description="Analyze attendance trends, late arrival density, and leave distribution across the selected time window."
        stats={[
          { label: 'Window', value: `${dateRange} days` },
          { label: 'Records', value: `${data?.totalAttendance ?? 0}` },
        ]}
        actions={
          <>
            <select value={dateRange} onChange={(event) => setDateRange(Number(event.target.value))} className="glass-select min-w-[10rem]">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button type="button" onClick={exportCsv} className="glass-button-primary">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance Rate" value={`${data?.attendanceRate ?? 0}%`} icon={TrendingUp} color="green" delay={0.04} />
        <StatCard title="Late Rate" value={`${data?.lateRate ?? 0}%`} icon={PieChartIcon} color="amber" delay={0.1} />
        <StatCard title="Approved Leaves" value={data?.approvedLeaves ?? 0} icon={Download} color="blue" delay={0.16} />
        <StatCard title="Total Logs" value={data?.totalAttendance ?? 0} icon={TrendingUp} color="blue" delay={0.22} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Daily attendance trend</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
            Follow check-in volume across the selected window and compare it against late arrivals.
          </p>

          <div className="mt-6 h-80">
            {isLoading ? (
              <Skeleton className="h-full rounded-[28px]" />
            ) : data?.attendanceTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'dd MMM')} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(value) => format(new Date(value), 'EEE, MMM d')} />
                  <Legend />
                  <Line type="monotone" dataKey="checkedIn" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No attendance analytics yet" description="Attendance trends will render after the first set of check-ins." />
            )}
          </div>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Leave distribution</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
            See how requests are split between pending, approved, and rejected states.
          </p>

          <div className="mt-6 h-80">
            {isLoading ? (
              <Skeleton className="h-full rounded-[28px]" />
            ) : data?.leaveDistribution.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leaveDistribution}
                    dataKey="value"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={4}
                    isAnimationActive
                  >
                    {data.leaveDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No leave distribution yet" description="Once leave requests start moving through the workflow, the split will appear here." />
            )}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel glow="amber" contentClassName="p-6">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Late arrival density by department</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
          Compare departments with heavier late patterns against their on-time attendance volume.
        </p>

        <div className="mt-6 h-80">
          {isLoading ? (
            <Skeleton className="h-full rounded-[28px]" />
          ) : data?.lateByDepartment.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.lateByDepartment}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTime" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No department late analytics yet" description="Department-level late arrival reporting will appear after attendance records are available." />
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
