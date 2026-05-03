import { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface MiniSparklineProps {
  values: number[];
  className?: string;
  color?: string;
}

export function MiniSparkline({
  values,
  className,
  color = '#00d4ff',
}: MiniSparklineProps) {
  const gradientId = useId();
  const points = useMemo(() => {
    if (!values.length) {
      return '';
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * 100;
        const y = 30 - ((value - min) / range) * 24;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  const areaPoints = points ? `0,36 ${points} 100,36` : '';

  return (
    <svg viewBox="0 0 100 36" className={cn('h-10 w-full', className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        points={areaPoints}
        fill={`url(#${gradientId})`}
      />
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
