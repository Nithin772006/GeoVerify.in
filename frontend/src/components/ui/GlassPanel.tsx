import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

const glowMap = {
  blue: 'from-sky-400/25 via-blue-500/10 to-transparent shadow-[0_30px_80px_rgba(37,99,235,0.18)]',
  emerald: 'from-emerald-400/25 via-emerald-500/10 to-transparent shadow-[0_30px_80px_rgba(16,185,129,0.18)]',
  amber: 'from-amber-300/25 via-amber-500/10 to-transparent shadow-[0_30px_80px_rgba(245,158,11,0.16)]',
  rose: 'from-rose-300/25 via-rose-500/10 to-transparent shadow-[0_30px_80px_rgba(244,63,94,0.16)]',
};

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
  glow?: keyof typeof glowMap;
  hover?: boolean;
}

export function GlassPanel({
  children,
  className,
  contentClassName,
  delay = 0,
  glow = 'blue',
  hover = true,
}: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={cn(
        'group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] backdrop-blur-2xl',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition-transform duration-500 group-hover:scale-105',
          glowMap[glow],
        )}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[30px] border border-white/8 transition-colors group-hover:border-cyan-400/18" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_28%,rgba(4,11,22,0.38))]" />
      <div className={cn('relative', contentClassName)}>{children}</div>
    </motion.div>
  );
}
