import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';

interface AnimatedNumberProps {
  value: number | string;
  className?: string;
  duration?: number;
}

function parseAnimatedValue(value: number | string) {
  if (typeof value === 'number') {
    return { numeric: value, prefix: '', suffix: '', decimals: Number.isInteger(value) ? 0 : 1 };
  }

  const match = value.trim().match(/^([^0-9-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    numeric: Number(match[2]),
    suffix: match[3],
    decimals: match[2].includes('.') ? match[2].split('.')[1]?.length ?? 0 : 0,
  };
}

export function AnimatedNumber({
  value,
  className,
  duration = 900,
}: AnimatedNumberProps) {
  const parsed = useMemo(() => parseAnimatedValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(() => parsed?.numeric ?? 0);

  useEffect(() => {
    if (!parsed) {
      return;
    }

    const start = performance.now();
    const from = 0;
    const to = parsed.numeric;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, parsed]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={cn('tabular-nums', className)}>
      {parsed.prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}
      {parsed.suffix}
    </span>
  );
}
