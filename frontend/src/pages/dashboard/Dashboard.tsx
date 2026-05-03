import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarOff,
  Clock3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
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
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/cards/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { getAdminDashboardData } from '../../services/modules/admin';
import { supabase } from '../../services/supabase';

const PIE_COLORS = ['#38bdf8', '#10b981', '#f59e0b'];

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
        <Skeleton className="h-28 w-full rounded-[30px]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[26rem] rounded-[28px]" />
          <Skeleton className="h-[26rem] rounded-[28px]" />
        </div>
      </div>
    );
  }

  const quickActions = [
    { label: 'Review attendance records', to: '/admin/attendance' },
    { label: 'Manage employees', to: '/admin/employees' },
    { label: 'Resolve leave queue', to: '/admin/leave' },
    { label: 'Plan the holiday calendar', to: '/admin/holidays' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mission Control"
        title="Premium workforce command center"
        description="Track live attendance momentum, leave pressure, and department-level activity from a single admin cockpit."
        stats={[
          { label: 'Today', value: format(new Date(), 'EEE, MMM d') },
          { label: 'Attendance rate', value: `${data?.attendanceRate ?? 0}%` },
        ]}
        actions={
          <Link to="/admin/reports" className="glass-button-primary">
            Open analytics studio
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={data?.totalEmployees ?? 0} icon={Users} color="blue" delay={0.04} />
        <StatCard title="Active Employees" value={data?.activeEmployees ?? 0} icon={Sparkles} color="green" delay={0.1} />
        <StatCard title="Checked In Today" value={data?.presentToday ?? 0} icon={UserCheck} color="green" delay={0.16} />
        <StatCard title="Pending Leaves" value={data?.pendingLeaves ?? 0} icon={CalendarOff} color="amber" delay={0.22} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
                Attendance Trend
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                Check-in volume over the last 7 days
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
                Spot shifts in attendance cadence and see whether late arrivals are starting to stack up.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-600 dark:text-cyan-300">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 h-80">
            {data?.trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData}>
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
              <EmptyState
                title="No attendance records yet"
                description="Once employees start checking in, the seven-day attendance trend will appear here."
              />
            )}
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel glow="emerald" contentClassName="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
                  Today&apos;s Snapshot
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  Late arrivals are at {data?.lateToday ?? 0} today.
                </div>
              </div>
              <Clock3 className="h-6 w-6 text-amber-500 dark:text-amber-300" />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300/65">Attendance rate</span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {data?.presentToday ?? 0} / {data?.activeEmployees ?? 0}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-200/70 dark:bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-500"
                    style={{ width: `${data?.attendanceRate ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center justify-between rounded-2xl border border-white/55 bg-white/72 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/82 dark:hover:bg-white/9"
                  >
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel glow="amber" contentClassName="p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
              Leave Distribution
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              Review request balance at a glance
            </div>

            <div className="mt-6 h-64">
              {data?.leaveStatusData.some((entry) => entry.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.leaveStatusData}
                      dataKey="value"
                      innerRadius={56}
                      outerRadius={86}
                      paddingAngle={4}
                    >
                      {data.leaveStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No leave activity yet"
                  description="As leave requests are created, their status split will show up in this panel."
                />
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel glow="blue" contentClassName="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
              Department Coverage
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              Which teams are already checked in today?
            </h2>
          </div>
          <div className="rounded-2xl border border-white/55 bg-white/72 px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
            {data?.departmentData.length ?? 0} departments represented
          </div>
        </div>

        <div className="mt-6 h-80">
          {data?.departmentData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="checkedIn" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="No department activity yet"
              description="Today&apos;s department bar chart will populate as soon as attendance records are created."
            />
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
      const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      const [attendanceRes, leaveRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('status, date')
          .eq('employee_id', user!.id)
          .gte('date', startOfMonth)
          .order('date', { ascending: false }),
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

      const rows = attendanceRes.data ?? [];
      const leaves = leaveRes.data ?? [];
      const presentDays = rows.filter((row) => ['Present', 'Late'].includes(row.status)).length;
      const lateDays = rows.filter((row) => row.status === 'Late').length;
      const workingDays = new Date().getDate();

      return {
        presentDays,
        lateDays,
        workingDays,
        percentage: workingDays ? Math.round((presentDays / workingDays) * 100) : 0,
        pendingLeaves: leaves.filter((leave) => leave.status === 'Pending').length,
        recentDays: rows.slice(0, 5),
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-28 w-full rounded-[30px]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My Dashboard"
        title="Your monthly attendance rhythm"
        description="Track check-ins, watch your attendance percentage, and keep your leave queue under control."
        stats={[
          { label: 'This month', value: format(new Date(), 'MMMM yyyy') },
          { label: 'Attendance', value: `${employeeStats?.percentage ?? 0}%` },
        ]}
        actions={
          <Link to="/attendance" className="glass-button-primary">
            Mark attendance
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {canClaimFirstAdmin ? (
        <GlassPanel glow="amber" contentClassName="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-600 dark:text-amber-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
                  One-Time Bootstrap
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  No admin exists yet.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300/62">
                  You can claim the first admin account from here before anyone else does.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimFirstAdmin}
              disabled={claimingAdmin}
              className="glass-button-primary disabled:opacity-60"
            >
              {claimingAdmin ? 'Claiming...' : 'Claim admin access'}
            </button>
          </div>
        </GlassPanel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Present Days" value={employeeStats?.presentDays ?? 0} icon={UserCheck} color="green" delay={0.04} />
        <StatCard title="Working Days" value={employeeStats?.workingDays ?? 0} icon={CalendarDays} color="blue" delay={0.1} />
        <StatCard title="Attendance %" value={`${employeeStats?.percentage ?? 0}%`} icon={TrendingUp} color={(employeeStats?.percentage ?? 0) >= 80 ? 'green' : 'amber'} delay={0.16} />
        <StatCard title="Pending Leaves" value={employeeStats?.pendingLeaves ?? 0} icon={CalendarOff} color="amber" delay={0.22} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
                Performance Arc
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                You are on track for a strong month.
              </h2>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-600 dark:text-cyan-300">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300/65">Attendance progress</span>
              <span className="font-semibold text-slate-950 dark:text-white">
                {employeeStats?.presentDays ?? 0} / {employeeStats?.workingDays ?? 0} active days
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-200/70 dark:bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-500"
                style={{ width: `${employeeStats?.percentage ?? 0}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/55 bg-white/72 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm text-slate-500 dark:text-slate-300/45">Late days</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {employeeStats?.lateDays ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-white/55 bg-white/72 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm text-slate-500 dark:text-slate-300/45">Account</div>
              <div className="mt-2 truncate text-sm font-semibold text-slate-950 dark:text-white">
                {user?.email}
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
            Recent Rhythm
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            Latest attendance moments
          </div>

          <div className="mt-6 space-y-3">
            {employeeStats?.recentDays.length ? (
              employeeStats.recentDays.map((entry) => (
                <div
                  key={`${entry.date}-${entry.status}`}
                  className="flex items-center justify-between rounded-2xl border border-white/55 bg-white/72 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {format(new Date(entry.date), 'EEE, MMM d')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-300/45">
                      Attendance log recorded
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      entry.status === 'Present'
                        ? 'bg-emerald-400/12 text-emerald-600 dark:text-emerald-300'
                        : entry.status === 'Late'
                          ? 'bg-amber-300/18 text-amber-600 dark:text-amber-300'
                          : 'bg-slate-300/18 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No attendance records this month"
                description="Your latest check-ins will appear here once the month gets underway."
              />
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}
