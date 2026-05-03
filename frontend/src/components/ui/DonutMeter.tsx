import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DonutMeterProps {
  value: number;
  label: string;
  secondaryLabel?: string;
  className?: string;
  children?: ReactNode;
  track?: string;
}

export function DonutMeter({
  value,
  label,
  secondaryLabel,
  className,
  children,
  track = 'rgba(255,255,255,0.08)',
}: DonutMeterProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <motion.div
        initial={{ rotate: -24, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-44 w-44 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(from 180deg, #00d4ff 0deg, #00b896 ${safeValue * 3.6}deg, ${track} ${safeValue * 3.6}deg, ${track} 360deg)`,
          boxShadow: '0 0 60px rgba(0, 212, 255, 0.15)',
        }}
      >
        <div
          className="absolute inset-[18px] rounded-full border border-white/10 bg-[#09111e]/90 backdrop-blur-xl"
          style={{ boxShadow: `inset 0 0 0 18px ${track}` }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-4xl font-semibold text-white tabular-nums">{safeValue}%</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.34em] text-white/45">{label}</div>
          {secondaryLabel ? (
            <div className="mt-2 text-xs text-white/55">{secondaryLabel}</div>
          ) : null}
          {children}
        </div>
      </motion.div>
    </div>
  );
}
