import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CalendarCheck, Users, CalendarOff, PieChart, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
}

interface SidebarBodyProps {
  collapsed: boolean;
  onCollapseToggle: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}

function SidebarBody({ collapsed, onCollapseToggle, onNavigate, mobile = false }: SidebarBodyProps) {
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

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/78 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,rgba(15,23,42,0.22))]" />

      <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2.5 shadow-[0_0_35px_rgba(34,211,238,0.25)]"
        >
          <Sparkles className="h-6 w-6 shrink-0 text-cyan-300" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="whitespace-nowrap text-xl font-bold text-white"
            >
              GeoVerify.in
            </motion.h1>
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

      <div className="relative px-5">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
          <div className="text-xs uppercase tracking-[0.22em] text-white/35">Workspace</div>
          <div className="mt-2 text-sm font-semibold text-white">{role === 'admin' ? 'Admin command deck' : 'Employee mission panel'}</div>
          {!collapsed && (
            <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              Live sync active
            </div>
          )}
        </div>
      </div>

      {!mobile && (
        <button
          onClick={onCollapseToggle}
          className="absolute right-4 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <nav className="relative mt-6 flex-1 overflow-y-auto space-y-1.5 px-3 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              'group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
              collapsed && !mobile && 'justify-center px-0',
              isActive
                ? 'text-white'
                : 'text-white/55 hover:bg-white/7 hover:text-white/85'
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/28 via-blue-500/18 to-emerald-400/16"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <link.icon className={cn('relative z-10 h-5 w-5 shrink-0', isActive && 'text-cyan-300')} />
                <AnimatePresence>
                  {(!collapsed || mobile) && (
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
        <div className={cn('mb-3 rounded-2xl border border-white/10 bg-white/5 p-3', collapsed && !mobile && 'px-0 text-center')}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Signed in</div>
          {(!collapsed || mobile) ? (
            <>
              <div className="mt-1 truncate text-sm font-semibold text-white">{role === 'admin' ? 'Administrator' : 'Team member'}</div>
              <div className="truncate text-xs text-white/45">{user?.email}</div>
            </>
          ) : (
            <div className="mt-2 text-xs font-semibold text-white/65">{role === 'admin' ? 'AD' : 'EM'}</div>
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
            'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/45 transition-all hover:bg-rose-500/12 hover:text-rose-300',
            collapsed && !mobile && 'justify-center px-0'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {(!collapsed || mobile) && (
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
  collapsed,
  mobileOpen,
  onCollapseToggle,
  onMobileClose,
}: SidebarProps) => {
  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 92 : 288 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hidden min-h-screen p-4 md:block"
      >
        <SidebarBody collapsed={collapsed} onCollapseToggle={onCollapseToggle} />
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
              <SidebarBody
                collapsed={false}
                mobile
                onCollapseToggle={onCollapseToggle}
                onNavigate={onMobileClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
