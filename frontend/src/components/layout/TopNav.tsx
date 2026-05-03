import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Moon, PanelLeftOpen, Search, Sun, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface TopNavProps {
  onMenuClick: () => void;
}

export const TopNav = ({ onMenuClick }: TopNavProps) => {
  const { user, role } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 xl:px-8">
      <div className="flex flex-col gap-4 rounded-[28px] border border-white/55 bg-white/72 px-4 py-4 shadow-[0_25px_60px_rgba(148,163,184,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onMenuClick}
              className="rounded-2xl border border-white/55 bg-white/75 p-2.5 text-slate-600 shadow-[0_10px_25px_rgba(148,163,184,0.16)] hover:bg-white md:hidden dark:border-white/10 dark:bg-white/5 dark:text-white/70"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>

            <div className="hidden rounded-2xl border border-white/55 bg-white/75 px-4 py-2 shadow-[0_10px_25px_rgba(148,163,184,0.16)] dark:border-white/10 dark:bg-white/5 lg:block">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">Today</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {format(now, 'EEE, MMM d')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-2xl border border-white/55 bg-white/75 p-2.5 text-slate-500 shadow-[0_10px_25px_rgba(148,163,184,0.16)] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="relative rounded-2xl border border-white/55 bg-white/75 p-2.5 text-slate-500 shadow-[0_10px_25px_rgba(148,163,184,0.16)] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
              <motion.span
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 dark:border-slate-900"
              />
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
              placeholder="Search employees, attendance, reports..."
              className="glass-input pl-10"
        />
      </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="hidden rounded-2xl border border-white/55 bg-white/75 px-4 py-2 shadow-[0_10px_25px_rgba(148,163,184,0.16)] dark:border-white/10 dark:bg-white/5 sm:block">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">Role</div>
              <div className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{role ?? 'guest'}</div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/75 px-3 py-2 shadow-[0_10px_25px_rgba(148,163,184,0.16)] dark:border-white/10 dark:bg-white/5">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.35)]"
              >
                <User className="h-4 w-4" />
              </motion.div>
              <div className="min-w-0">
                <div className="max-w-[170px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.email}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-300/45">
                  {format(now, 'hh:mm a')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
