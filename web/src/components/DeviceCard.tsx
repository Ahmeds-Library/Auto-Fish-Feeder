import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Clock, Fish, Radio, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isOnline, timeAgo } from '../lib/format';
import { DeviceWithId } from '../types/schema';
import { AnimatedStatus, MotionCard } from './motion';

function signalLabel(rssi?: number) {
  if (typeof rssi !== 'number') return 'Unknown';
  if (rssi > -55) return 'Excellent';
  if (rssi > -70) return 'Good';
  if (rssi > -82) return 'Weak';
  return 'Poor';
}

export function DeviceCard({ device }: { device: DeviceWithId }) {
  const online = isOnline(device.status?.lastSeen);
  const rssi = device.status?.wifi?.rssi;
  const hasError = Boolean(device.status?.lastError);
  const statusTone = hasError ? 'danger' : online ? 'success' : 'warning';

  return (
    <Link to={`/devices/${device.id}/overview`} className="group block min-w-0">
      <MotionCard className={`card card-hover overflow-hidden ${hasError ? 'border-rose-300/25 bg-rose-500/10' : online ? 'border-emerald-300/15' : 'border-amber-300/15'}`}>
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl transition group-hover:bg-cyan-300/20" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <motion.span className="rounded-2xl bg-cyan-300/15 p-3 text-cyan-100 ring-1 ring-cyan-300/20 transition group-hover:bg-cyan-300 group-hover:text-slate-950" whileHover={{ rotate: -4, scale: 1.05 }}>
              <Fish size={24} />
            </motion.span>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-white">{device.name}</h3>
              <p className="mt-1 truncate text-sm text-slate-400">{device.id}</p>
            </div>
          </div>
          <AnimatedStatus tone={statusTone} label={hasError ? 'error' : online ? 'online' : 'offline'} pulse={online || hasError} />
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
            <div className="flex items-center gap-2 text-slate-400"><Clock size={16} /> Last feed</div>
            <b className="mt-2 block text-base text-cyan-50">{timeAgo(device.status?.feeding?.lastFeedAt)}</b>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
            <div className="flex items-center gap-2 text-slate-400"><Utensils size={16} /> Today</div>
            <b className="mt-2 block text-base text-cyan-50">{device.status?.feeding?.todayCount ?? 0} feeds</b>
          </div>
        </div>

        <div className="relative mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/10 px-3 py-1">Last seen: {timeAgo(device.status?.lastSeen)}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Motor: {device.status?.motor?.state || 'unknown'}</span>
          <span className="rounded-full bg-white/10 px-3 py-1"><Radio className="mr-1 inline" size={13} /> {signalLabel(rssi)} {typeof rssi === 'number' ? `(${rssi} dBm)` : ''}</span>
        </div>

        {device.status?.lastError && (
          <p className="relative mt-4 flex gap-2 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-100 ring-1 ring-rose-300/15">
            <AlertTriangle className="shrink-0" size={17} /> {device.status.lastError}
          </p>
        )}

        <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-cyan-200">
          <span>Open device</span>
          <motion.span className="inline-flex" initial={false} whileHover={{ x: 4 }}><ArrowRight size={17} /></motion.span>
        </div>
      </MotionCard>
    </Link>
  );
}
