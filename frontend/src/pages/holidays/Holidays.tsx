import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { addHoliday, getHolidays, getFriendlyError, removeHoliday } from '../../services/modules/admin';
import type { Holiday } from '../../types/admin';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Holidays() {
  const queryClient = useQueryClient();
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), name: '' });

  useRealtimeInvalidation(
    'holidays-live',
    [{ table: 'holidays', queryKeys: [['holidays'], ['admin-dashboard']] }],
    true,
  );

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: getHolidays,
  });

  const createHolidayMutation = useMutation({
    mutationFn: addHoliday,
    onSuccess: () => {
      toast.success('Holiday added successfully.');
      setIsModalOpen(false);
      setForm({ date: format(new Date(), 'yyyy-MM-dd'), name: '' });
      void queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to add holiday.'));
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: removeHoliday,
    onSuccess: () => {
      toast.success('Holiday deleted successfully.');
      void queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to delete holiday.'));
    },
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(visibleMonth),
    end: endOfMonth(visibleMonth),
  });
  const monthPadding = Array.from({ length: getDay(startOfMonth(visibleMonth)) });

  const holidaysThisMonth = holidays.filter((holiday) => isSameMonth(parseISO(holiday.date), visibleMonth));
  const upcomingHolidays = holidays
    .filter((holiday) => parseISO(holiday.date) >= startOfMonth(new Date()))
    .slice(0, 6);

  const totals = useMemo(
    () => ({
      total: holidays.length,
      thisMonth: holidaysThisMonth.length,
      thisYear: holidays.filter((holiday) => format(parseISO(holiday.date), 'yyyy') === format(new Date(), 'yyyy'))
        .length,
    }),
    [holidays, holidaysThisMonth.length],
  );

  const holidayLookup = new Map(holidays.map((holiday) => [holiday.date, holiday]));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Holiday Planner"
        title="Maintain the official holiday calendar"
        description="Add or remove holidays, highlight the calendar view, and keep the team aligned on upcoming non-working days."
        stats={[
          { label: 'Total', value: `${totals.total}` },
          { label: 'This month', value: `${totals.thisMonth}` },
        ]}
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className="glass-button-primary">
            <Plus className="h-4 w-4" />
            Add holiday
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <GlassPanel glow="blue" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Total holidays</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{totals.total}</div>
        </GlassPanel>
        <GlassPanel glow="emerald" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">This year</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{totals.thisYear}</div>
        </GlassPanel>
        <GlassPanel glow="amber" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Upcoming</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{upcomingHolidays.length}</div>
        </GlassPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
                Calendar View
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {format(visibleMonth, 'MMMM yyyy')}
              </h2>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setVisibleMonth((current) => subMonths(current, 1))} className="glass-button-secondary px-4 py-2">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, 1))} className="glass-button-secondary px-4 py-2">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-3">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300/45">
                {day}
              </div>
            ))}

            {monthPadding.map((_, index) => (
              <div key={`empty-${index}`} className="h-24 rounded-[24px] border border-dashed border-white/35 dark:border-white/8" />
            ))}

            {daysInMonth.map((day) => {
              const holiday = holidayLookup.get(format(day, 'yyyy-MM-dd'));
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 rounded-[24px] border p-3 transition ${
                    holiday
                      ? 'border-cyan-300/50 bg-cyan-400/12 shadow-[0_18px_40px_rgba(14,165,233,0.16)] dark:border-cyan-400/25 dark:bg-cyan-400/10'
                      : 'border-white/55 bg-white/68 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-900 dark:text-white'}`}>
                      {format(day, 'd')}
                    </span>
                    {holiday ? <CalendarDays className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> : null}
                  </div>

                  {holiday ? (
                    <div className="mt-3 text-sm font-medium text-slate-900 dark:text-white">{holiday.name}</div>
                  ) : (
                    <div className="mt-6 text-xs text-slate-400 dark:text-slate-500">No holiday</div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
            Upcoming Holidays
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            Keep the team calendar synchronized
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-[24px]" />)
            ) : holidays.length === 0 ? (
              <EmptyState title="No holidays configured" description="Add your first holiday to populate the calendar." />
            ) : (
              upcomingHolidays.map((holiday: Holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/55 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div>
                    <div className="font-semibold text-slate-950 dark:text-white">{holiday.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-300/55">
                      {format(parseISO(holiday.date), 'EEE, MMM d, yyyy')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                    className="rounded-2xl border border-white/55 bg-white/72 p-2 text-slate-500 transition hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-white/55 dark:hover:text-rose-300"
                    aria-label={`Delete ${holiday.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add holiday"
        description="Create a holiday entry so it appears in the admin calendar and employee schedules."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createHolidayMutation.mutate(form);
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="holiday-name" className="glass-label">
              Holiday name
            </label>
            <input
              id="holiday-name"
              required
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div>
            <label htmlFor="holiday-date" className="glass-label">
              Date
            </label>
            <input
              id="holiday-date"
              required
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="glass-button-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createHolidayMutation.isPending} className="glass-button-primary disabled:opacity-60">
              {createHolidayMutation.isPending ? 'Saving...' : 'Save holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
