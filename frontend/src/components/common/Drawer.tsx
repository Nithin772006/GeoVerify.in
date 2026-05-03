import { useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ open, title, description, onClose, children }: DrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            aria-label="Close drawer backdrop"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/55 bg-white/90 shadow-[0_40px_120px_rgba(15,23,42,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/88"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/45 px-6 py-5 dark:border-white/10">
              <div>
                <h2 id={titleId} className="text-2xl font-semibold text-slate-950 dark:text-white">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/65">{description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/55 bg-white/70 p-2 text-slate-500 transition hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
