import { useState } from 'react';
import { Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface HintProps {
  content: string;
  label?: string;
  className?: string;
}

export function Hint({ content, label = 'More info', className }: HintProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/45 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
      >
        <Info className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-10 z-30 w-64 rounded-2xl border border-white/10 bg-slate-950/92 p-3 text-xs leading-5 text-white/72 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
          >
            {content}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
