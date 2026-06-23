import { Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './ui';

export function DashboardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = useMemo(() => {
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local timezone';
    const seconds = now.getSeconds();
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    return {
      time,
      date,
      timezone,
      secondDeg: seconds * 6,
      minuteDeg: minutes * 6,
      hourDeg: hours * 30,
    };
  }, [now]);

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-start">
        <div>
          <p className="badge-info w-fit"><Clock3 size={14} /> Local clock</p>
          <h2 className="mt-4 font-mono text-4xl font-black tracking-tight text-white sm:text-5xl">{parts.time}</h2>
          <p className="mt-2 text-sm text-slate-300">{parts.date}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{parts.timezone}</p>
        </div>

        <div className="relative mx-auto grid h-32 w-32 shrink-0 place-items-center rounded-full border border-cyan-300/20 bg-slate-950/45 shadow-glow sm:mx-0">
          <span className="absolute inset-3 rounded-full border border-white/10" />
          <span className="absolute h-2 w-2 rounded-full bg-cyan-200 shadow-glow" />
          <span className="absolute left-1/2 top-1/2 h-10 w-1 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-cyan-100" style={{ transform: `translate(-50%, -100%) rotate(${parts.hourDeg}deg)` }} />
          <span className="absolute left-1/2 top-1/2 h-12 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-sky-300" style={{ transform: `translate(-50%, -100%) rotate(${parts.minuteDeg}deg)` }} />
          <span className="absolute left-1/2 top-1/2 h-14 w-px origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-emerald-300" style={{ transform: `translate(-50%, -100%) rotate(${parts.secondDeg}deg)` }} />
        </div>
      </div>
    </GlassCard>
  );
}
