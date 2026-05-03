import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, PanelLeftOpen, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';

interface TopNavProps {
  onMenuClick: () => void;
}

export const TopNav = ({ onMenuClick }: TopNavProps) => {
  const { user, role } = useAuth();
  const [now, setNow] = useState(new Date());
  const location = useLocation();

  const titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/attendance': 'My Attendance',
    '/leave': 'My Leaves',
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/attendance': 'Attendance Matrix',
    '/admin/employees': 'Employees',
    '/admin/leave': 'Leave Requests',
    '/admin/holidays': 'Holidays',
    '/admin/reports': 'Reports',
    '/admin/settings': 'Settings',
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 xl:px-8">
      <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-white/10 bg-[#0c1524]/76 px-4 py-4 shadow-[0_22px_60px_rgba(2,8,20,0.32)] backdrop-blur-2xl sm:px-5">
        <button
          onClick={onMenuClick}
          className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 text-white/70 hover:bg-white/[0.08] md:hidden"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">{role ?? 'workspace'}</div>
          <div className="truncate text-lg font-semibold text-white">{titleMap[location.pathname] ?? 'GeoVerify'}</div>
        </div>

        <div className="relative order-3 w-full md:order-none md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
          <input
            type="text"
            placeholder="Search"
            className="glass-input pl-10"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2 text-right lg:block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">{format(now, 'EEE, MMM d')}</div>
            <div className="text-sm font-semibold text-white/82">{format(now, 'hh:mm a')}</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="relative rounded-[18px] border border-white/10 bg-white/[0.04] p-2.5 text-white/60 transition-colors hover:bg-white/[0.08]"
          >
            <Bell className="h-5 w-5" />
            <motion.span
              animate={{ scale: [1, 1.22, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(0,212,255,0.9)]"
            />
          </motion.button>

          <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/45 to-teal-500/35 text-white shadow-[0_12px_32px_rgba(0,212,255,0.18)]"
            >
              <User className="h-4 w-4" />
            </motion.div>
            <div className="hidden min-w-0 sm:block">
              <div className="max-w-[190px] truncate text-sm font-semibold text-white">{user?.email}</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">online</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
