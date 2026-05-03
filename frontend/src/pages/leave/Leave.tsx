import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, Check, Clock3, PlaneTakeoff, Search, X } from 'lucide-react';
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

export default function Leave() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminLeave /> : <EmployeeLeave />;
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
        eyebrow="Leave Flow"
        title="Plan and track your time away"
        description="Create leave requests, monitor approvals, and keep your attendance timeline predictable."
        stats={[
          { label: 'Pending', value: `${summary.pending}` },
          { label: 'Approved', value: `${summary.approved}` },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-600 dark:text-cyan-300">
              <PlaneTakeoff className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Request leave</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
                Pick your dates, add a short reason, and the request will land in the admin review queue.
              </p>
            </div>
          </div>

          <form onSubmit={submitLeave} className="mt-6 space-y-4">
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
              placeholder="Reason for leave"
            />
            <button disabled={loading} type="submit" className="glass-button-primary w-full disabled:opacity-50">
              Submit request
            </button>
          </form>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">My requests</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
                Review your request history and cancel anything still pending.
              </p>
            </div>
            <div className="rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
              {leaves?.length ?? 0} total
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-[24px]" />)
            ) : leaves?.length === 0 ? (
              <EmptyState title="No leave requests yet" description="Your submitted leave requests will appear here." />
            ) : (
              (leaves ?? []).map((leave) => (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-white/55 bg-white/68 p-5 shadow-[0_15px_35px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
                        <CalendarDays className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                        {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">{leave.reason}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge label={leave.status} />
                      {leave.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={() => cancelLeave(leave.id)}
                          className="rounded-full border border-rose-300/25 bg-rose-400/8 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-400/14 dark:text-rose-300"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Review Queue"
        title="Resolve employee leave requests"
        description="Filter by status, search the queue, and approve or reject leave requests with optimistic updates."
        stats={[
          { label: 'Pending', value: `${summary.pending}` },
          { label: 'Visible requests', value: `${leaves.length}` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <GlassPanel glow="amber" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Pending</div>
          <div className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950 dark:text-white">
            <Clock3 className="h-7 w-7 text-amber-500 dark:text-amber-300" />
            {summary.pending}
          </div>
        </GlassPanel>
        <GlassPanel glow="emerald" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Approved</div>
          <div className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950 dark:text-white">
            <Check className="h-7 w-7 text-emerald-500 dark:text-emerald-300" />
            {summary.approved}
          </div>
        </GlassPanel>
        <GlassPanel glow="rose" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Rejected</div>
          <div className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950 dark:text-white">
            <X className="h-7 w-7 text-rose-500 dark:text-rose-300" />
            {summary.rejected}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel glow="blue" contentClassName="p-5">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or leave reason"
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

      <GlassPanel glow="blue" contentClassName="p-6">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[24px]" />)
          ) : leaves.length === 0 ? (
            <EmptyState
              title="No leave requests found"
              description="Try changing the status filter or search query."
            />
          ) : (
            leaves.map((leave) => (
              <div
                key={leave.id}
                className="rounded-[24px] border border-white/55 bg-white/68 p-5 shadow-[0_15px_35px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-950 dark:text-white">
                      {leave.employees?.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-300/45">
                      {leave.employees?.email}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300/45">
                      {leave.employees?.department || 'General'}
                    </div>
                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-200/82">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">{leave.reason}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={leave.status} />

                    {leave.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => statusMutation.mutate({ leaveId: leave.id, status: 'Approved' })}
                          className="glass-button-secondary px-4 py-2 text-emerald-600 dark:text-emerald-300"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => statusMutation.mutate({ leaveId: leave.id, status: 'Rejected' })}
                          className="glass-button-secondary px-4 py-2 text-rose-600 dark:text-rose-300"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
