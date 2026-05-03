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

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <GlassPanel glow="blue" contentClassName="p-5">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </GlassPanel>
  );
}

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
  const visibleMonthHolidays = holidays
    .filter((holiday) => isSameMonth(parseISO(holiday.date), visibleMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

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
        title="Holidays"
        description="Calendar-first holiday management."
        stats={[
          { label: 'Month', value: format(visibleMonth, 'MMMM yyyy') },
          { label: 'Total', value: `${totals.total}` },
        ]}
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className="glass-button-primary">
            <Plus className="h-4 w-4" />
            Add holiday
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryTile label="Total" value={totals.total} />
        <SummaryTile label="This year" value={totals.thisYear} />
        <SummaryTile label="This month" value={totals.thisMonth} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">Calendar</div>
              <div className="mt-2 text-2xl font-semibold text-white">{format(visibleMonth, 'MMMM yyyy')}</div>
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

          <div className="grid grid-cols-7 gap-3">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
                {day}
              </div>
            ))}

            {monthPadding.map((_, index) => (
              <div key={`empty-${index}`} className="min-h-28 rounded-[24px] border border-dashed border-white/8 bg-white/[0.02]" />
            ))}

            {daysInMonth.map((day) => {
              const holiday = holidayLookup.get(format(day, 'yyyy-MM-dd'));
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`group min-h-28 rounded-[24px] border p-3 transition ${
                    holiday
                      ? 'border-cyan-400/22 bg-cyan-400/10 shadow-[0_18px_40px_rgba(0,212,255,0.12)]'
                      : 'border-white/10 bg-white/[0.04]'
                  } ${isToday ? 'ring-1 ring-white/18' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-cyan-200' : 'text-white'}`}>
                      {format(day, 'd')}
                    </span>
                    {holiday ? <CalendarDays className="h-4 w-4 text-cyan-200" /> : null}
                  </div>

                  {holiday ? (
                    <div className="mt-4 flex h-[calc(100%-2rem)] flex-col justify-between">
                      <div className="text-sm font-medium text-white">{holiday.name}</div>
                      <button
                        type="button"
                        onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                        className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/54 transition hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-12 h-2 w-10 rounded-full bg-white/[0.05]" />
                  )}
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel glow="emerald" contentClassName="p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">Agenda</div>
              <div className="mt-2 text-2xl font-semibold text-white">{format(visibleMonth, 'MMMM')}</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/48">
              {visibleMonthHolidays.length} items
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-[24px]" />)
            ) : visibleMonthHolidays.length === 0 ? (
              <EmptyState title="No holidays this month" description="Add one to highlight it on the calendar." />
            ) : (
              visibleMonthHolidays.map((holiday: Holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <div>
                    <div className="font-semibold text-white">{holiday.name}</div>
                    <div className="text-sm text-white/48">
                      {format(parseISO(holiday.date), 'EEE, MMM d, yyyy')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:text-rose-300"
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
        description="Create a holiday entry for the shared calendar."
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
