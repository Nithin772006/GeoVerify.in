import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, CalendarOff, LayoutDashboard, LogOut, PieChart, Settings, Sparkles, Users, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface SidebarBodyProps {
  expanded: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
}

function SidebarBody({ expanded, onNavigate, mobile = false }: SidebarBodyProps) {
  const { role, signOut, user, hasModuleAccess } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' as const },
    { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance', module: 'attendance' as const },
    { to: '/admin/employees', icon: Users, label: 'Employees', module: 'employees' as const },
    { to: '/admin/leave', icon: CalendarOff, label: 'Leave Requests', module: 'leave' as const },
    { to: '/admin/holidays', icon: CalendarOff, label: 'Holidays', module: 'holidays' as const },
    { to: '/admin/reports', icon: PieChart, label: 'Reports', module: 'reports' as const },
    { to: '/admin/settings', icon: Settings, label: 'Settings', module: 'settings' as const },
  ];

  const employeeLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' as const },
    { to: '/attendance', icon: CalendarCheck, label: 'My Attendance', module: 'attendance' as const },
    { to: '/leave', icon: CalendarOff, label: 'My Leaves', module: 'leave' as const },
  ];

  const links = (role === 'admin' ? adminLinks : employeeLinks).filter((link) => hasModuleAccess(link.module));
  const initials = role === 'admin' ? 'AD' : 'EM';

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#09121e]/82 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.2),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,184,150,0.14),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_26%,rgba(2,6,23,0.28))]" />

      <div className={cn('relative flex items-center gap-3 px-4 pb-5 pt-6', !expanded && !mobile && 'justify-center px-0')}>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
          className="rounded-2xl border border-cyan-400/18 bg-cyan-400/10 p-2.5 shadow-[0_0_35px_rgba(0,212,255,0.18)]"
        >
          <Sparkles className="h-6 w-6 shrink-0 text-cyan-300" />
        </motion.div>
        <AnimatePresence>
          {(expanded || mobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="min-w-0 whitespace-nowrap"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.32em] text-white/36">GeoVerify</div>
              <div className="text-lg font-bold text-white">Attendance OS</div>
            </motion.div>
          )}
        </AnimatePresence>

        {mobile && (
          <button
            onClick={onNavigate}
            className="ml-auto rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn('relative px-3', !expanded && !mobile && 'px-2')}>
        <div className={cn('flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-3 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.2)]', !expanded && !mobile && 'justify-center px-0')}>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.85)]" />
          {(expanded || mobile) ? (
            <div className="text-xs font-medium uppercase tracking-[0.26em] text-white/46">Live Sync</div>
          ) : null}
        </div>
      </div>

      <nav className="relative mt-6 flex-1 overflow-y-auto space-y-2 px-3 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            aria-label={link.label}
            className={({ isActive }) => cn(
              'group relative flex items-center gap-3 overflow-hidden rounded-[22px] px-3 py-3 text-sm font-medium transition-all duration-200',
              !expanded && !mobile && 'justify-center px-0',
              isActive ? 'text-white' : 'text-white/52 hover:bg-white/[0.06] hover:text-white/88'
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-[22px] border border-cyan-400/25 bg-gradient-to-r from-cyan-500/24 via-sky-500/10 to-emerald-400/18"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <link.icon className={cn('relative z-10 h-5 w-5 shrink-0', isActive && 'text-cyan-300')} />
                <AnimatePresence>
                  {(expanded || mobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative border-t border-white/8 p-3">
        <div className={cn('mb-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-3', !expanded && !mobile && 'px-0 text-center')}>
          {expanded || mobile ? (
            <>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">{role}</div>
              <div className="mt-1 truncate text-sm font-semibold text-white">{user?.email}</div>
            </>
          ) : (
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xs font-semibold text-white/72">
              {initials}
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            await signOut();
            onNavigate?.();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-sm font-medium text-white/42 transition-all hover:bg-rose-500/10 hover:text-rose-300',
            !expanded && !mobile && 'justify-center px-0'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {(expanded || mobile) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}

export const Sidebar = ({
  mobileOpen,
  onMobileClose,
}: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: expanded ? 280 : 92 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="hidden min-h-screen p-4 md:block"
      >
        <SidebarBody expanded={expanded} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[292px] p-3 md:hidden"
            >
              <SidebarBody expanded mobile onNavigate={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
