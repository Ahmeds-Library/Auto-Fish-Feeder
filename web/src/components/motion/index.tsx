import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

export const pageVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.42, ease } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2, ease } },
};

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.03 } },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease } },
};

export function MotionPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      animate="show"
      exit={reduced ? undefined : 'exit'}
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : 'hidden'} animate="show" variants={staggerContainer}>
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      variants={cardVariants}
      initial={reduced ? false : 'hidden'}
      animate="show"
      whileHover={reduced ? undefined : { y: -4, boxShadow: '0 0 35px rgba(34, 211, 238, 0.16)' }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.22, ease }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.75, ease });
    const unsubscribe = rounded.on('change', setDisplay);
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [motionValue, reduced, rounded, value]);

  return <>{display.toLocaleString()}</>;
}

export function AnimatedStatus({ tone = 'info', label, pulse = false }: { tone?: 'success' | 'warning' | 'danger' | 'info'; label: string; pulse?: boolean }) {
  const colors = {
    success: 'bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,.75)]',
    warning: 'bg-amber-300 shadow-[0_0_18px_rgba(245,158,11,.55)]',
    danger: 'bg-rose-300 shadow-[0_0_18px_rgba(251,113,133,.65)]',
    info: 'bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]',
  };
  return (
    <motion.span layout className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-50">
      <motion.span
        className={`h-2.5 w-2.5 rounded-full ${colors[tone]}`}
        animate={pulse ? { scale: [1, 1.45, 1], opacity: [0.75, 1, 0.75] } : { scale: 1 }}
        transition={{ duration: 1.4, repeat: pulse ? Infinity : 0, ease }}
      />
      {label}
    </motion.span>
  );
}
