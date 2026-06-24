import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Circle, Info, LucideIcon, Loader2 } from 'lucide-react';
import { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { AnimatedNumber, MotionCard, MotionPage } from './motion';

export function PageTransition({ children }: { children: ReactNode }) {
  return <MotionPage>{children}</MotionPage>;
}

export function GlassCard({ children, className = '', interactive = false, style }: { children: ReactNode; className?: string; interactive?: boolean; style?: CSSProperties }) {
  return <MotionCard className={`card ${interactive ? 'card-hover' : ''} ${className}`} style={style}>{children}</MotionCard>;
}

export function MetricCard({ label, value, helper, icon: Icon, delay = 0 }: { label: string; value: ReactNode; helper?: string; icon?: LucideIcon; delay?: number }) {
  return (
    <GlassCard className="metric-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {Icon && <Icon className="text-cyan-200" size={20} />}
      </div>
      <b className="mt-3 block text-3xl font-black tracking-tight text-white sm:text-4xl">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </b>
      {helper && <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p>}
    </GlassCard>
  );
}

export function StatusBadge({ tone = 'info', children }: { tone?: 'success' | 'warning' | 'danger' | 'info'; children: ReactNode }) {
  const classes = {
    success: 'badge-ok',
    warning: 'badge-warn',
    danger: 'badge-danger',
    info: 'badge-info',
  };
  return <motion.span layout className={classes[tone]}>{children}</motion.span>;
}

export function DeviceStatusPulse({ online }: { online: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.95)]' : 'bg-amber-300'}`}
      animate={online ? { scale: [1, 1.45, 1], opacity: [0.75, 1, 0.75] } : { scale: 1 }}
      transition={{ duration: 1.6, repeat: online ? Infinity : 0, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

export function EmptyState({ icon: Icon = Circle, title, body, action }: { icon?: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <GlassCard className="text-center">
      <motion.div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/20" whileHover={{ rotate: -3, scale: 1.04 }}>
        <Icon size={32} />
      </motion.div>
      <h2 className="mt-4 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mx-auto my-3 max-w-xl text-slate-300">{body}</p>
      {action}
    </GlassCard>
  );
}

export function AlertMessage({ tone = 'info', children }: { tone?: 'success' | 'warning' | 'danger' | 'info'; children: ReactNode }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'danger' ? AlertTriangle : Info;
  const classes = {
    success: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
    warning: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
    danger: 'border-rose-300/20 bg-rose-500/10 text-rose-100',
    info: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
  };
  return (
    <AnimatePresence mode="popLayout">
      <motion.p
        className={`flex gap-2 rounded-2xl border p-3 text-sm leading-6 ${classes[tone]}`}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <Icon className="mt-0.5 shrink-0" size={17} /> {children}
      </motion.p>
    </AnimatePresence>
  );
}

export function PrimaryButton({ children, loading = false, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} className={`btn-primary inline-flex min-h-11 items-center justify-center gap-2 ${className}`} disabled={loading || props.disabled} {...props}>{loading && <Loader2 className="animate-spin" size={17} />}{children}</motion.button>;
}

export function SecondaryButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} className={`btn-ghost inline-flex min-h-11 items-center justify-center gap-2 ${className}`} {...props}>{children}</motion.button>;
}

export function InputField({ label, icon: Icon, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: LucideIcon }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />}
        <input className={`field ${Icon ? 'pl-11' : ''} ${className}`} {...props} />
      </div>
    </label>
  );
}

export function SelectField({ label, children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <select className={`field ${className}`} {...props}>{children}</select>
    </label>
  );
}

export function LoadingState({ label = 'Loading aquarium cloud...' }: { label?: string }) {
  return <GlassCard className="flex items-center gap-3 text-cyan-100"><Loader2 className="animate-spin" size={18} /> {label}</GlassCard>;
}

export function TimelineItem({ tone = 'info', title, meta, children, delay = 0 }: { tone?: 'success' | 'warning' | 'danger' | 'info'; title: string; meta?: string; children?: ReactNode; delay?: number }) {
  const dot = tone === 'danger' ? 'bg-rose-300' : tone === 'warning' ? 'bg-amber-300' : tone === 'success' ? 'bg-emerald-300' : 'bg-cyan-300';
  return (
    <GlassCard className="relative ml-4 border-l-2 border-l-cyan-300/30" style={{ animationDelay: `${delay}ms` }}>
      <motion.span className={`absolute -left-[9px] top-7 h-4 w-4 rounded-full ${dot} shadow-glow`} layout />
      <StatusBadge tone={tone}>{title}</StatusBadge>
      {children && <div className="mt-3 font-semibold text-white">{children}</div>}
      {meta && <p className="mt-2 text-sm text-slate-400">{meta}</p>}
    </GlassCard>
  );
}
