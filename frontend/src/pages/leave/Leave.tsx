import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, format } from 'date-fns';
import { Check, Clock3, PlaneTakeoff, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  getAdminLeaveRequests,
  getFriendlyError,
  updateLeaveStatus,
} from '../../services/modules/admin';
import { supabase } from '../../services/supabase';
import type { LeaveRequest } from '../../types/admin';

function LeaveSummaryTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
  tone: string;
}) {
  return (
    <GlassPanel glow="blue" contentClassName="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassPanel>
  );
}

function EmployeeLeave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['my-leaves', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user!.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }
      return data || [];
    },
  });

  const summary = useMemo(() => {
    const items = leaves ?? [];
    return {
      pending: items.filter((leave) => leave.status === 'Pending').length,
      approved: items.filter((leave) => leave.status === 'Approved').length,
      rejected: items.filter((leave) => leave.status === 'Rejected').length,
    };
  }, [leaves]);

  const submitLeave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('leave_requests').insert({
        employee_id: user!.id,
        ...form,
        status: 'Pending',
      });

      if (error) {
        throw error;
      }

      toast.success('Leave request submitted.');
      setForm({ start_date: '', end_date: '', reason: '' });
      void queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
    } catch (error: any) {
      toast.error(`Failed to submit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelLeave = async (leaveId: string) => {
    try {
      const { error } = await supabase.from('leave_requests').delete().eq('id', leaveId);
      if (error) {
        throw error;
      }
      toast.success('Leave request cancelled.');
      void queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request.');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Leaves"
        description="Leave request planner and history timeline."
        stats={[
          { label: 'Pending', value: `${summary.pending}` },
          { label: 'Approved', value: `${summary.approved}` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LeaveSummaryTile label="Pending" value={summary.pending} icon={Clock3} tone="text-amber-300" />
        <LeaveSummaryTile label="Approved" value={summary.approved} icon={Check} tone="text-emerald-300" />
        <LeaveSummaryTile label="Rejected" value={summary.rejected} icon={X} tone="text-rose-300" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
              <PlaneTakeoff className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/30">Planner</div>
              <div className="mt-2 text-2xl font-semibold text-white">Request time away</div>
            </div>
          </div>

          <form onSubmit={submitLeave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                type="date"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                className="glass-input"
              />
              <input
                required
                type="date"
                value={form.end_date}
                onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                className="glass-input"
              />
            </div>
            <textarea
              required
              rows={5}
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              className="glass-textarea"
              placeholder="Reason"
            />
            <button disabled={loading} type="submit" className="glass-button-primary w-full disabled:opacity-50">
              Submit request
            </button>
          </form>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/30">Timeline</div>
              <div className="mt-2 text-2xl font-semibold text-white">History</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
              {leaves?.length ?? 0} total
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-[24px]" />)
            ) : leaves?.length === 0 ? (
              <EmptyState title="No leave history" description="Your requests will appear here once submitted." />
            ) : (
              (leaves ?? []).map((leave, index) => {
                const days = differenceInCalendarDays(new Date(leave.end_date), new Date(leave.start_date)) + 1;

                return (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative pl-8"
                  >
                    <div className="absolute left-[11px] top-0 h-full w-px bg-white/8" />
                    <div className="absolute left-0 top-6 h-6 w-6 rounded-full border border-cyan-400/22 bg-cyan-400/12 shadow-[0_0_20px_rgba(0,212,255,0.14)]" />
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-lg font-semibold text-white">
                              {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                            </div>
                            <StatusBadge label={leave.status} />
                          </div>
                          <div className="mt-2 text-sm text-white/48">{days} day{days > 1 ? 's' : ''}</div>
                          <div className="mt-4 text-sm leading-6 text-white/68">{leave.reason}</div>
                        </div>

                        {leave.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => cancelLeave(leave.id)}
                            className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/14"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {index === (leaves?.length ?? 0) - 1 ? null : <div className="h-2" />}
                  </motion.div>
                );
              })
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function LeaveCard({
  leave,
  onApprove,
  onReject,
}: {
  leave: LeaveRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{leave.employees?.name}</div>
          <div className="text-sm text-white/42">{leave.employees?.email}</div>
        </div>
        <StatusBadge label={leave.status} />
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/30">
        {leave.employees?.department || 'General'}
      </div>
      <div className="mt-3 text-sm font-medium text-white/82">
        {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
      </div>
      <div className="mt-3 text-sm leading-6 text-white/66">{leave.reason}</div>

      {leave.status === 'Pending' ? (
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onApprove} className="glass-button-secondary flex-1 px-4 py-2 text-emerald-300">
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button type="button" onClick={onReject} className="glass-button-secondary flex-1 px-4 py-2 text-rose-300">
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AdminLeave() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  useRealtimeInvalidation(
    'admin-leave-live',
    [{ table: 'leave_requests', queryKeys: [['admin-leaves'], ['admin-dashboard'], ['reports']] }],
    true,
  );

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['admin-leaves', statusFilter, deferredSearch],
    queryFn: () => getAdminLeaveRequests({ status: statusFilter, search: deferredSearch }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ leaveId, status }: { leaveId: string; status: LeaveRequest['status'] }) =>
      updateLeaveStatus(leaveId, status),
    onMutate: async ({ leaveId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-leaves'] });

      const snapshots = queryClient.getQueriesData<LeaveRequest[]>({ queryKey: ['admin-leaves'] });

      queryClient.setQueriesData<LeaveRequest[]>({ queryKey: ['admin-leaves'] }, (current) =>
        current?.map((leave) => (leave.id === leaveId ? { ...leave, status } : leave)) ?? [],
      );

      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, snapshot]) => {
        queryClient.setQueryData(queryKey, snapshot);
      });
      toast.error(getFriendlyError(error, 'Failed to update leave request.'));
    },
    onSuccess: (_data, variables) => {
      toast.success(`Leave ${variables.status.toLowerCase()} successfully.`);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const summary = useMemo(() => {
    return {
      pending: leaves.filter((leave) => leave.status === 'Pending').length,
      approved: leaves.filter((leave) => leave.status === 'Approved').length,
      rejected: leaves.filter((leave) => leave.status === 'Rejected').length,
    };
  }, [leaves]);

  const columns = useMemo(
    () => [
      { key: 'Pending' as const, count: summary.pending, accent: 'text-amber-300' },
      { key: 'Approved' as const, count: summary.approved, accent: 'text-emerald-300' },
      { key: 'Rejected' as const, count: summary.rejected, accent: 'text-rose-300' },
    ],
    [summary.approved, summary.pending, summary.rejected],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leave Requests"
        description="Kanban review for pending, approved, and rejected leave requests."
        stats={[
          { label: 'Pending', value: `${summary.pending}` },
          { label: 'Visible', value: `${leaves.length}` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LeaveSummaryTile label="Pending" value={summary.pending} icon={Clock3} tone="text-amber-300" />
        <LeaveSummaryTile label="Approved" value={summary.approved} icon={Check} tone="text-emerald-300" />
        <LeaveSummaryTile label="Rejected" value={summary.rejected} icon={X} tone="text-rose-300" />
      </div>

      <GlassPanel glow="blue" contentClassName="p-5">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or reason"
              className="glass-input pl-10"
            />
          </div>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="glass-select">
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-3">
        {columns.map((column) => {
          const columnItems = leaves.filter((leave) => leave.status === column.key);

          return (
            <GlassPanel key={column.key} glow="blue" contentClassName="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className={`text-lg font-semibold ${column.accent}`}>{column.key}</div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
                  {column.count}
                </div>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-[24px]" />)
                ) : columnItems.length === 0 ? (
                  <EmptyState title={`No ${column.key.toLowerCase()} items`} description="This column is clear." />
                ) : (
                  columnItems.map((leave) => (
                    <LeaveCard
                      key={leave.id}
                      leave={leave}
                      onApprove={() => statusMutation.mutate({ leaveId: leave.id, status: 'Approved' })}
                      onReject={() => statusMutation.mutate({ leaveId: leave.id, status: 'Rejected' })}
                    />
                  ))
                )}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

export default function Leave() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminLeave /> : <EmployeeLeave />;
}
