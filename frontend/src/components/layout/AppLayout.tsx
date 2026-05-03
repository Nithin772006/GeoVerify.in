import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Background3D } from '../ui/Background3D';

export const AppLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('app-sidebar-collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('app-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900 transition-colors duration-300 dark:text-white">
      <Background3D variant="app" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_35%),linear-gradient(180deg,rgba(248,250,252,0.68),rgba(248,250,252,0.2))] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.7),rgba(2,6,23,0.82))]" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCollapseToggle={() => setCollapsed((current) => !current)}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <TopNav onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
            <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
