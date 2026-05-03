import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subDays,
} from 'date-fns';
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
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CalendarDays,
  CalendarOff,
  Clock3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/cards/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { DonutMeter } from '../../components/ui/DonutMeter';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { getAdminDashboardData } from '../../services/modules/admin';
import { supabase } from '../../services/supabase';

const PIE_COLORS = ['#00d4ff', '#00b896', '#f6c453'];
const CHART_GRID = 'rgba(255,255,255,0.08)';
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(7, 13, 24, 0.94)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
  color: '#fff',
};

function SnapshotTile({
  label,
  value,
  tint,
}: {
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/10 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/34">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white" style={{ color: tint }}>
        {value}
      </div>
    </div>
  );
}

function MonthHeatmap({
  records,
}: {
  records: Array<{ date: string; status: 'Present' | 'Late' }>;
}) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const padding = Array.from({ length: getDay(monthStart) });

  const lookup = new Map(records.map((record) => [record.date, record.status]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.22em] text-white/26">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {padding.map((_, index) => (
          <div key={`pad-${index}`} className="aspect-square rounded-2xl border border-white/5 bg-white/[0.02]" />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const status = lookup.get(key);
          const isToday = isSameDay(day, new Date());
          const tone =
            status === 'Present'
              ? 'border-emerald-400/20 bg-emerald-400/28'
              : status === 'Late'
                ? 'border-amber-300/25 bg-amber-300/28'
                : 'border-white/5 bg-white/[0.04]';

          return (
            <div
              key={key}
              title={`${format(day, 'EEE, MMM d')}${status ? ` • ${status}` : ''}`}
              className={`aspect-square rounded-2xl border transition hover:-translate-y-0.5 ${tone} ${isToday ? 'ring-1 ring-cyan-400/45' : ''}`}
            >
              <div className="flex h-full items-end justify-end p-2 text-[11px] font-medium text-white/66">
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboard() {
  useRealtimeInvalidation(
    'admin-dashboard-live',
    [
      { table: 'employees', queryKeys: [['admin-dashboard']] },
      { table: 'attendance', queryKeys: [['admin-dashboard']] },
      { table: 'leave_requests', queryKeys: [['admin-dashboard']] },
    ],
    true,
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboardData,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full rounded-[30px]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
          <Skeleton className="h-[28rem] rounded-[28px]" />
          <Skeleton className="h-[28rem] rounded-[28px]" />
        </div>
      </div>
    );
  }

  const trendSeries = data?.trendData ?? [];
  const checkedInSpark = trendSeries.map((item) => item.checkedIn);
  const leaveSpark = (data?.leaveStatusData ?? []).map((item) => item.value);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Center"
        description="Live workforce overview with attendance flow, leave load, and department coverage."
        stats={[
          { label: 'Today', value: format(new Date(), 'EEE, MMM d') },
          { label: 'Attendance', value: `${data?.attendanceRate ?? 0}%` },
        ]}
        actions={
          <Link to="/admin/reports" className="glass-button-primary">
            Reports
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={data?.totalEmployees ?? 0}
          icon={Users}
          color="blue"
          delay={0.04}
          sparklineData={checkedInSpark.map((value) => value + Math.max(0, (data?.totalEmployees ?? 0) - (data?.presentToday ?? 0)))}
        />
        <StatCard
          title="Active"
          value={data?.activeEmployees ?? 0}
          icon={Sparkles}
          color="green"
          delay={0.1}
          sparklineData={checkedInSpark.map((value) => Math.min(data?.activeEmployees ?? 0, value + (data?.lateToday ?? 0)))}
        />
        <StatCard
          title="Checked In"
          value={data?.presentToday ?? 0}
          icon={UserCheck}
          color="green"
          delay={0.16}
          trend={{ value: data?.attendanceRate ?? 0, isPositive: (data?.attendanceRate ?? 0) >= 70 }}
          sparklineData={checkedInSpark}
        />
        <StatCard
          title="Leave Queue"
          value={data?.pendingLeaves ?? 0}
          icon={CalendarOff}
          color="amber"
          delay={0.22}
          sparklineData={leaveSpark.length ? leaveSpark : [0, 0, 0]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">Attendance Flow</div>
              <div className="mt-2 text-2xl font-semibold text-white">7-day check-in arc</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-cyan-400/18 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                {data?.presentToday ?? 0} present
              </div>
              <div className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                {data?.lateToday ?? 0} late
              </div>
            </div>
          </div>

          <div className="h-80">
            {trendSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries}>
                  <defs>
                    <linearGradient id="attendanceArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.42" />
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'dd MMM')} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(value) => format(new Date(value), 'EEE, MMM d')}
                    cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Area type="monotone" dataKey="checkedIn" stroke="#00d4ff" strokeWidth={3} fill="url(#attendanceArea)" />
                  <Area type="monotone" dataKey="late" stroke="#f6c453" strokeWidth={2.2} fill="rgba(246,196,83,0.05)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No attendance yet" description="The live attendance curve appears after the first check-ins." />
            )}
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel glow="emerald" contentClassName="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/34">Live Grid</div>
                <div className="mt-2 text-2xl font-semibold text-white">Today</div>
              </div>
              <Clock3 className="h-5 w-5 text-amber-300" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotTile label="Rate" value={`${data?.attendanceRate ?? 0}%`} tint="#00d4ff" />
              <SnapshotTile label="Late" value={data?.lateToday ?? 0} tint="#f6c453" />
              <SnapshotTile label="Pending" value={data?.pendingLeaves ?? 0} tint="#00b896" />
              <SnapshotTile label="Teams" value={data?.departmentData.length ?? 0} tint="#ffffff" />
            </div>
          </GlassPanel>

          <GlassPanel glow="amber" contentClassName="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/34">Leave Split</div>
                <div className="mt-2 text-2xl font-semibold text-white">Queue balance</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
                {(data?.leaveStatusData ?? []).reduce((sum, item) => sum + item.value, 0)} total
              </div>
            </div>

            <div className="h-64">
              {data?.leaveStatusData.some((entry) => entry.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.leaveStatusData}
                      dataKey="value"
                      innerRadius={54}
                      outerRadius={86}
                      paddingAngle={4}
                    >
                      {data.leaveStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No leave activity" description="Leave distribution appears as requests move through the queue." />
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(data?.leaveStatusData ?? []).map((item, index) => (
                <div key={item.name} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-white/64">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  {item.name}: {item.value}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel glow="blue" contentClassName="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">Coverage</div>
            <div className="mt-2 text-2xl font-semibold text-white">Department check-ins</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
            {data?.departmentData.length ?? 0} departments
          </div>
        </div>

        <div className="h-80">
          {data?.departmentData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentData}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="department" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="checkedIn" fill="#00d4ff" radius={[10, 10, 0, 0]} />
                <Bar dataKey="late" fill="#f6c453" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No coverage yet" description="Department distribution appears once today’s records start landing." />
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function EmployeeDashboard() {
  const { user, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  const { data: employeeStats, isLoading } = useQuery({
    queryKey: ['employee-dashboard-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const [attendanceRes, leaveRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('status, date')
          .eq('employee_id', user!.id)
          .gte('date', monthStart)
          .order('date', { ascending: true }),
        supabase
          .from('leave_requests')
          .select('id, status')
          .eq('employee_id', user!.id)
          .order('created_at', { ascending: false }),
      ]);

      if (attendanceRes.error) {
        throw attendanceRes.error;
      }

      if (leaveRes.error && leaveRes.error.code !== '42P01') {
        throw leaveRes.error;
      }

      const rows = (attendanceRes.data ?? []) as Array<{ status: 'Present' | 'Late'; date: string }>;
      const leaves = leaveRes.data ?? [];
      const presentDays = rows.filter((row) => ['Present', 'Late'].includes(row.status)).length;
      const lateDays = rows.filter((row) => row.status === 'Late').length;
      const workingDays = new Date().getDate();
      const weekStart = subDays(new Date(), 6);
      const weekSeries = Array.from({ length: 7 }, (_, index) => {
        const day = format(subDays(new Date(), 6 - index), 'yyyy-MM-dd');
        const match = rows.find((row) => row.date === day);
        return {
          day,
          value: match ? (match.status === 'Late' ? 0.68 : 1) : 0,
        };
      });

      return {
        presentDays,
        lateDays,
        workingDays,
        percentage: workingDays ? Math.round((presentDays / workingDays) * 100) : 0,
        pendingLeaves: leaves.filter((leave) => leave.status === 'Pending').length,
        approvedLeaves: leaves.filter((leave) => leave.status === 'Approved').length,
        rows,
        weekSeries: weekSeries.filter((entry) => new Date(entry.day) >= weekStart),
      };
    },
  });

  const { data: canClaimFirstAdmin } = useQuery({
    queryKey: ['can-claim-first-admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('can_claim_first_admin');
      if (error) {
        throw error;
      }
      return Boolean(data);
    },
    staleTime: 30_000,
  });

  const handleClaimFirstAdmin = async () => {
    setClaimingAdmin(true);

    try {
      const { data, error } = await supabase.rpc('claim_first_admin');
      if (error) {
        throw error;
      }

      toast.success(data?.message || 'Admin access granted.');
      await refreshRole();
      navigate('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Could not claim admin access');
    } finally {
      setClaimingAdmin(false);
    }
  };

  const weekSpark = employeeStats?.weekSeries.map((item) => item.value * 100) ?? [];
  const statusSplit = useMemo(
    () => [
      { name: 'Present', value: Math.max(0, (employeeStats?.presentDays ?? 0) - (employeeStats?.lateDays ?? 0)) },
      { name: 'Late', value: employeeStats?.lateDays ?? 0 },
      { name: 'Open', value: Math.max(0, (employeeStats?.workingDays ?? 0) - (employeeStats?.presentDays ?? 0)) },
    ],
    [employeeStats?.lateDays, employeeStats?.presentDays, employeeStats?.workingDays],
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full rounded-[30px]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your Month"
        description="Attendance ring, month heatmap, and check-in rhythm."
        stats={[
          { label: 'Window', value: format(new Date(), 'MMMM yyyy') },
          { label: 'Attendance', value: `${employeeStats?.percentage ?? 0}%` },
        ]}
        actions={
          <Link to="/attendance" className="glass-button-primary">
            Check in
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {canClaimFirstAdmin ? (
        <GlassPanel glow="amber" contentClassName="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">Bootstrap</div>
                <div className="mt-2 text-2xl font-semibold text-white">First admin slot is open</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimFirstAdmin}
              disabled={claimingAdmin}
              className="glass-button-primary disabled:opacity-60"
            >
              {claimingAdmin ? 'Claiming...' : 'Claim admin'}
            </button>
          </div>
        </GlassPanel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Present" value={employeeStats?.presentDays ?? 0} icon={UserCheck} color="green" delay={0.04} sparklineData={weekSpark} />
        <StatCard title="Working Days" value={employeeStats?.workingDays ?? 0} icon={CalendarDays} color="blue" delay={0.1} sparklineData={Array.from({ length: 7 }, (_, index) => Math.max(1, new Date().getDate() - (6 - index)))} />
        <StatCard title="Attendance" value={`${employeeStats?.percentage ?? 0}%`} icon={TrendingUp} color={(employeeStats?.percentage ?? 0) >= 80 ? 'green' : 'amber'} delay={0.16} sparklineData={weekSpark} />
        <StatCard title="Pending Leaves" value={employeeStats?.pendingLeaves ?? 0} icon={CalendarOff} color="amber" delay={0.22} sparklineData={[employeeStats?.pendingLeaves ?? 0, employeeStats?.approvedLeaves ?? 0, employeeStats?.pendingLeaves ?? 0]} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">Attendance Ring</div>
              <div className="mt-2 text-2xl font-semibold text-white">Current pace</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
              {employeeStats?.lateDays ?? 0} late
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-center xl:justify-between">
            <DonutMeter
              value={employeeStats?.percentage ?? 0}
              label="attendance"
              secondaryLabel={`${employeeStats?.presentDays ?? 0} / ${employeeStats?.workingDays ?? 0} days`}
            />

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[16rem] xl:grid-cols-1">
              {statusSplit.map((item, index) => (
                <div key={item.name} className="rounded-[22px] border border-white/8 bg-black/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/34">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                    {item.name}
                  </div>
                  <div className="text-2xl font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusSplit}
                  dataKey="value"
                  innerRadius={54}
                  outerRadius={82}
                  paddingAngle={4}
                >
                  {statusSplit.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">Calendar Heatmap</div>
              <div className="mt-2 text-2xl font-semibold text-white">Daily trace</div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-white/54">Off</div>
              <div className="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-emerald-200">Present</div>
              <div className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-amber-200">Late</div>
            </div>
          </div>

          <MonthHeatmap records={employeeStats?.rows ?? []} />
        </GlassPanel>
      </div>

      <GlassPanel glow="blue" contentClassName="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">Recent Pulse</div>
            <div className="mt-2 text-2xl font-semibold text-white">Last 7 days</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
            {user?.email}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employeeStats?.weekSeries ?? []}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(value) => format(new Date(value), 'dd MMM')} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(value) => format(new Date(value), 'EEE, MMM d')}
                formatter={(value) => {
                  const numeric = typeof value === 'number' ? value : 0;
                  return [numeric === 1 ? 'Present' : numeric === 0.68 ? 'Late' : 'No log', 'Status'];
                }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {(employeeStats?.weekSeries ?? []).map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.value === 1 ? '#00b896' : entry.value === 0.68 ? '#f6c453' : 'rgba(255,255,255,0.12)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}
