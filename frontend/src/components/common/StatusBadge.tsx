import { cn } from '../../utils/cn';

const badgeStyles: Record<string, string> = {
  Present: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Late: 'border-amber-300/22 bg-amber-300/10 text-amber-300',
  Pending: 'border-amber-300/22 bg-amber-300/10 text-amber-300',
  Approved: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Rejected: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  active: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  inactive: 'border-slate-200/12 bg-white/[0.05] text-slate-300',
  admin: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  employee: 'border-indigo-300/20 bg-indigo-300/10 text-indigo-200',
};

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
        badgeStyles[label] ?? 'border-slate-200/12 bg-white/[0.05] text-slate-300',
        className,
      )}
    >
      {label}
    </span>
  );
}
