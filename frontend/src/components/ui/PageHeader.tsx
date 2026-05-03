import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Hint } from './Hint';

interface HeaderStat {
  label: string;
  value: string;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: HeaderStat[];
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  stats,
}: PageHeaderProps) {
  const hintContent = [eyebrow, description].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          {hintContent ? <Hint content={hintContent} label={`${title} details`} /> : null}
        </div>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[0_16px_40px_rgba(2,8,20,0.28)]"
              >
                <div className="text-lg font-semibold text-white">{stat.value}</div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/36">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
