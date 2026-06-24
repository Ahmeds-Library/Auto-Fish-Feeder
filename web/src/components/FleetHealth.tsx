import { motion, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, Fish, LucideIcon, Radio } from 'lucide-react';

type FleetHealthProps = {
  total: number;
  online: number;
  feedsToday: number;
  alerts: number;
};

export function FleetHealth({ total, online, feedsToday, alerts }: FleetHealthProps) {
  const shouldReduceMotion = useReducedMotion();
  const offline = Math.max(total - online, 0);
  const ratio = total ? Math.round((online / total) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (ratio / 100) * circumference;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="card motion-glow relative overflow-hidden p-0 md:col-span-2 xl:col-span-2"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(52,211,153,0.10),transparent_28%)]" />
      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div className="flex items-center gap-5">
          <div className="relative grid size-32 shrink-0 place-items-center sm:size-36" aria-label={`${ratio}% of linked feeders are online`}>
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" role="img" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="9" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#fleetHealthGradient)"
                strokeLinecap="round"
                strokeWidth="9"
                strokeDasharray={circumference}
                initial={shouldReduceMotion ? false : { strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              />
              <defs>
                <linearGradient id="fleetHealthGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <p className="text-3xl font-black tracking-tight text-white">{ratio}%</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">online</p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="badge-info w-fit">Fleet health</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Linked feeder readiness</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A live owner-scoped view using only devices linked to this account. No global command paths are used.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FleetStat icon={Fish} label="Linked devices" value={total} helper="Visible in this account" />
          <FleetStat icon={Radio} label="Online / offline" value={`${online}/${offline}`} helper="Heartbeat based split" tone={offline ? 'warning' : 'success'} />
          <FleetStat icon={Activity} label="Feeds today" value={feedsToday} helper="Across linked feeders" />
          <FleetStat icon={AlertTriangle} label="Alerts" value={alerts} helper="Devices reporting errors" tone={alerts ? 'danger' : 'success'} />
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            <span>Online capacity</span>
            <span>{online} active • {offline} offline</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-slate-950/60">
            <motion.div
              initial={shouldReduceMotion ? false : { width: 0 }}
              animate={{ width: `${ratio}%` }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FleetStat({ icon: Icon, label, value, helper, tone = 'info' }: { icon: LucideIcon; label: string; value: number | string; helper: string; tone?: 'info' | 'success' | 'warning' | 'danger' }) {
  const toneClass = {
    info: 'text-cyan-200 bg-cyan-300/10 border-cyan-300/20',
    success: 'text-emerald-200 bg-emerald-300/10 border-emerald-300/20',
    warning: 'text-amber-200 bg-amber-300/10 border-amber-300/20',
    danger: 'text-rose-200 bg-rose-300/10 border-rose-300/20',
  }[tone];

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 shadow-inner shadow-white/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <span className={`rounded-2xl border p-2 ${toneClass}`}><Icon size={16} /></span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}
