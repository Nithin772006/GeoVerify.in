import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { MiniSparkline } from '../ui/MiniSparkline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'amber' | 'red';
  delay?: number;
  sparklineData?: number[];
}

const colorMap = {
  blue: {
    glow: 'blue' as const,
    icon: 'bg-cyan-400/12 text-cyan-300',
    spark: '#00d4ff',
  },
  green: {
    glow: 'emerald' as const,
    icon: 'bg-emerald-400/12 text-emerald-300',
    spark: '#00b896',
  },
  amber: {
    glow: 'amber' as const,
    icon: 'bg-amber-300/14 text-amber-300',
    spark: '#f6c453',
  },
  red: {
    glow: 'rose' as const,
    icon: 'bg-rose-300/14 text-rose-300',
    spark: '#fb7185',
  },
};

function toNumericValue(value: string | number) {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  delay = 0,
  sparklineData,
}: StatCardProps) => {
  const colors = colorMap[color];
  const numericValue = toNumericValue(value);
  const microSeries = sparklineData ?? [
    Math.max(0, numericValue * 0.48),
    Math.max(0, numericValue * 0.56),
    Math.max(0, numericValue * 0.52),
    Math.max(0, numericValue * 0.64),
    Math.max(0, numericValue * 0.62),
    Math.max(0, numericValue * 0.74),
    Math.max(0, numericValue * 0.7 + (trend?.value ?? 0)),
  ];

  return (
    <GlassPanel delay={delay} glow={colors.glow} className="h-full" contentClassName="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/34">{title}</div>
          <motion.div
            className="text-4xl font-semibold tracking-tight text-white"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.16, type: 'spring', stiffness: 180 }}
          >
            <AnimatedNumber value={value} />
          </motion.div>
        </div>

        <motion.div
          whileHover={{ rotate: 10, scale: 1.05 }}
          className={`flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/8 ${colors.icon}`}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-black/10 px-3 py-2">
        <MiniSparkline values={microSeries} color={colors.spark} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="h-1.5 w-16 rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(18, Math.min(100, numericValue || 20))}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: colors.spark }}
          />
        </div>

        {trend ? (
          <div
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              trend.isPositive ? 'bg-emerald-400/12 text-emerald-300' : 'bg-rose-400/12 text-rose-300'
            }`}
          >
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value)}%
          </div>
        ) : (
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/26">Live</div>
        )}
      </div>
    </GlassPanel>
  );
};
