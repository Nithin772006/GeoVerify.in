import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Background3D } from '../ui/Background3D';

export const AppLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="relative h-[100dvh] overflow-hidden text-white">
      <Background3D variant="app" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,184,150,0.06),transparent_26%),linear-gradient(180deg,rgba(6,10,18,0.2),rgba(6,10,18,0.66))]" />

      <div className="relative z-10 flex h-[100dvh]">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
          <TopNav onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
            <div className="mx-auto max-w-[1680px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full pb-6"
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
