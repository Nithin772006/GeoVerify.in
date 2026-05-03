import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'amber' | 'red';
  delay?: number;
}

const colorMap = {
  blue: {
    glow: 'blue' as const,
    icon: 'bg-cyan-400/14 text-cyan-600 dark:text-cyan-300',
    bar: 'from-cyan-400 via-sky-500 to-blue-500',
  },
  green: {
    glow: 'emerald' as const,
    icon: 'bg-emerald-400/14 text-emerald-600 dark:text-emerald-300',
    bar: 'from-emerald-400 via-emerald-500 to-teal-500',
  },
  amber: {
    glow: 'amber' as const,
    icon: 'bg-amber-300/18 text-amber-600 dark:text-amber-300',
    bar: 'from-amber-300 via-amber-400 to-orange-500',
  },
  red: {
    glow: 'rose' as const,
    icon: 'bg-rose-300/18 text-rose-600 dark:text-rose-300',
    bar: 'from-rose-300 via-rose-500 to-red-500',
  },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  delay = 0,
}: StatCardProps) => {
  const colors = colorMap[color];

  return (
    <GlassPanel delay={delay} glow={colors.glow} className="h-full" contentClassName="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300/55">{title}</p>
          <motion.h3
            className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.16, type: 'spring', stiffness: 180 }}
          >
            {value}
          </motion.h3>

          {trend && (
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                trend.isPositive
                  ? 'bg-emerald-400/12 text-emerald-600 dark:text-emerald-300'
                  : 'bg-rose-400/12 text-rose-600 dark:text-rose-300'
              }`}
            >
              <span>{trend.isPositive ? '+' : '-'}</span>
              {Math.abs(trend.value)}% vs last month
            </div>
          )}
        </div>

        <motion.div
          whileHover={{ rotate: 12, scale: 1.08 }}
          className={`flex h-14 w-14 items-center justify-center rounded-[22px] ${colors.icon}`}
        >
          <Icon className="h-7 w-7" />
        </motion.div>
      </div>

      <div className="mt-6 h-1.5 rounded-full bg-slate-200/70 dark:bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '68%' }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
        />
      </div>
    </GlassPanel>
  );
};
