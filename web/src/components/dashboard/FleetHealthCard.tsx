import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Wifi } from 'lucide-react';
import { AnimatedNumber } from '../motion';
import { GlassCard } from '../ui';

export function FleetHealthCard({ total, online, alerts, feedsToday }: { total: number; online: number; alerts: number; feedsToday: number }) {
  const ratio = total ? Math.round((online / total) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (ratio / 100) * circumference;

  return (
    <GlassCard className="overflow-hidden lg:col-span-2">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="badge-info w-fit"><ShieldCheck size={14} /> Fleet health</p>
          <h2 className="section-title mt-4">Owner-scoped devices are ready for hardware testing.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">The command center summarizes only feeders linked to this account and keeps every action scoped to one device.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Online" value={online} />
            <MiniStat label="Feeds today" value={feedsToday} />
            <MiniStat label="Alerts" value={alerts} tone={alerts ? 'text-rose-100' : 'text-emerald-100'} />
          </div>
        </div>
        <div className="relative mx-auto h-36 w-36 shrink-0 md:mx-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="9" />
            <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#healthGradient)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            <defs><linearGradient id="healthGradient"><stop offset="0%" stopColor="#22D3EE" /><stop offset="100%" stopColor="#34D399" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <b className="text-3xl font-black text-white"><AnimatedNumber value={ratio} />%</b>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">online</span>
          </div>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-full border border-white/10 bg-slate-950/55 p-1">
        <motion.div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" initial={{ width: 0 }} animate={{ width: `${ratio}%` }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </GlassCard>
  );
}

function MiniStat({ label, value, tone = 'text-cyan-50' }: { label: string; value: number; tone?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><Activity className="mb-2 text-cyan-200" size={16} /><p className={`text-xl font-black ${tone}`}><AnimatedNumber value={value} /></p><p className="text-xs text-slate-500">{label}</p></div>;
}
