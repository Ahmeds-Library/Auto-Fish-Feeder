import { AlertTriangle, CheckCircle2, Circle, Info, LucideIcon } from 'lucide-react';
import { CSSProperties, ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

export function GlassCard({ children, className = '', interactive = false, style }: { children: ReactNode; className?: string; interactive?: boolean; style?: CSSProperties }) {
  return <div className={`card ${interactive ? 'card-hover' : ''} ${className}`} style={style}>{children}</div>;
}

export function MetricCard({ label, value, helper, icon: Icon, delay = 0 }: { label: string; value: ReactNode; helper?: string; icon?: LucideIcon; delay?: number }) {
  return (
    <GlassCard className="metric-card stagger-item" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {Icon && <Icon className="text-cyan-200" size={20} />}
      </div>
      <b className="mt-3 block text-3xl font-black tracking-tight text-white sm:text-4xl">{value}</b>
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
  return <span className={classes[tone]}>{children}</span>;
}

export function DeviceStatusPulse({ online }: { online: boolean }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${online ? 'animate-pulse bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.95)]' : 'bg-amber-300'}`} />;
}

export function EmptyState({ icon: Icon = Circle, title, body, action }: { icon?: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <GlassCard className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/20">
        <Icon size={32} />
      </div>
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
    <p className={`flex gap-2 rounded-2xl border p-3 text-sm leading-6 ${classes[tone]}`}>
      <Icon className="mt-0.5 shrink-0" size={17} /> {children}
    </p>
  );
}
