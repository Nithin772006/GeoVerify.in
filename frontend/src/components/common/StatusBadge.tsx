import { cn } from '../../utils/cn';

const badgeStyles: Record<string, string> = {
  Present: 'bg-emerald-400/14 text-emerald-700 dark:text-emerald-300',
  Late: 'bg-amber-300/18 text-amber-700 dark:text-amber-300',
  Pending: 'bg-amber-300/18 text-amber-700 dark:text-amber-300',
  Approved: 'bg-emerald-400/14 text-emerald-700 dark:text-emerald-300',
  Rejected: 'bg-rose-400/14 text-rose-700 dark:text-rose-300',
  active: 'bg-emerald-400/14 text-emerald-700 dark:text-emerald-300',
  inactive: 'bg-slate-300/18 text-slate-700 dark:text-slate-300',
  admin: 'bg-cyan-400/14 text-cyan-700 dark:text-cyan-300',
  employee: 'bg-indigo-400/14 text-indigo-700 dark:text-indigo-300',
};

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        badgeStyles[label] ?? 'bg-slate-300/18 text-slate-700 dark:text-slate-300',
        className,
      )}
    >
      {label}
    </span>
  );
}
