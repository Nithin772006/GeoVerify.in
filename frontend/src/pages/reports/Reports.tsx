import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { downloadCsv } from '../../lib/csv';
import { getReportsData } from '../../services/modules/admin';

const PIE_COLORS = ['#00d4ff', '#00b896', '#f6c453'];
const GRID_COLOR = 'rgba(255,255,255,0.08)';
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(7, 13, 24, 0.94)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
  color: '#fff',
};

function ReportPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
      <span className="text-white/38">{label}</span>{' '}
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

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
        title="Reports"
        description="Chart-first attendance analytics."
        stats={[
          { label: 'Window', value: `${dateRange} days` },
          { label: 'Logs', value: `${data?.totalAttendance ?? 0}` },
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
              Export
            </button>
          </>
        }
      />

      <GlassPanel glow="blue" contentClassName="p-5">
        <div className="flex flex-wrap gap-3">
          <ReportPill label="Attendance" value={`${data?.attendanceRate ?? 0}%`} />
          <ReportPill label="Late" value={`${data?.lateRate ?? 0}%`} />
          <ReportPill label="Approved leaves" value={`${data?.approvedLeaves ?? 0}`} />
          <ReportPill label="Logs" value={`${data?.totalAttendance ?? 0}`} />
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/30">Attendance Trend</div>
            <div className="mt-2 text-2xl font-semibold text-white">Check-ins vs late arrivals</div>
          </div>

          <div className="h-[28rem]">
            {isLoading ? (
              <Skeleton className="h-full rounded-[28px]" />
            ) : data?.attendanceTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.attendanceTrend}>
                  <defs>
                    <linearGradient id="reportsAttendance" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="reportsLate" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f6c453" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f6c453" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'dd MMM')} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(value) => format(new Date(value), 'EEE, MMM d')} />
                  <Area type="monotone" dataKey="checkedIn" stroke="#00d4ff" strokeWidth={3} fill="url(#reportsAttendance)" />
                  <Area type="monotone" dataKey="late" stroke="#f6c453" strokeWidth={2.4} fill="url(#reportsLate)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No analytics yet" description="Trends appear after attendance starts flowing in." />
            )}
          </div>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/30">Leave Split</div>
            <div className="mt-2 text-2xl font-semibold text-white">Queue balance</div>
          </div>

          <div className="h-[28rem]">
            {isLoading ? (
              <Skeleton className="h-full rounded-[28px]" />
            ) : data?.leaveDistribution.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leaveDistribution}
                    dataKey="value"
                    innerRadius={82}
                    outerRadius={120}
                    paddingAngle={4}
                  >
                    {data.leaveDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No leave split" description="Leave distribution appears once requests are active." />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(data?.leaveDistribution ?? []).map((item, index) => (
              <div key={item.name} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-white/62">
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel glow="amber" contentClassName="p-6">
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/30">Departments</div>
          <div className="mt-2 text-2xl font-semibold text-white">Late density by team</div>
        </div>

        <div className="h-[26rem]">
          {isLoading ? (
            <Skeleton className="h-full rounded-[28px]" />
          ) : data?.lateByDepartment.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.lateByDepartment}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="department" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="onTime" fill="#00b896" radius={[10, 10, 0, 0]} />
                <Bar dataKey="late" fill="#f6c453" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No department data" description="Department analytics appear as attendance records grow." />
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
