import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface HeaderStat {
  label: string;
  value: string;
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
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
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_15px_35px_rgba(148,163,184,0.15)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
          {eyebrow}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300/68 sm:text-base">
            {description}
          </p>
        </div>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/55 bg-white/72 px-4 py-3 shadow-[0_20px_35px_rgba(148,163,184,0.18)] dark:border-white/10 dark:bg-white/5"
              >
                <div className="text-lg font-semibold text-slate-950 dark:text-white">{stat.value}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300/45">
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
