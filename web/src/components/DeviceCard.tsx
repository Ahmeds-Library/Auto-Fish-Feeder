import { AlertTriangle, Clock, Fish, Radio, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isOnline, timeAgo } from '../lib/format';
import { DeviceWithId } from '../types/schema';

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

  return (
    <Link to={`/devices/${device.id}/overview`} className="card card-hover group block overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-cyan-300/15 p-3 text-cyan-100 ring-1 ring-cyan-300/20 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
            <Fish size={24} />
          </span>
          <div>
            <h3 className="text-xl font-black text-white">{device.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{device.id}</p>
          </div>
        </div>
        <span className={online ? 'badge-ok' : 'badge-warn'}>
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]' : 'bg-amber-300'}`} />
          {online ? 'online' : 'offline'}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <div className="flex items-center gap-2 text-slate-400"><Clock size={16} /> Last feed</div>
          <b className="mt-2 block text-base text-cyan-50">{timeAgo(device.status?.feeding?.lastFeedAt)}</b>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <div className="flex items-center gap-2 text-slate-400"><Utensils size={16} /> Today</div>
          <b className="mt-2 block text-base text-cyan-50">{device.status?.feeding?.todayCount ?? 0} feeds</b>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full bg-white/10 px-3 py-1">Motor: {device.status?.motor?.state || 'unknown'}</span>
        <span className="rounded-full bg-white/10 px-3 py-1"><Radio className="mr-1 inline" size={13} /> {signalLabel(rssi)} {typeof rssi === 'number' ? `(${rssi} dBm)` : ''}</span>
      </div>

      {device.status?.lastError && (
        <p className="mt-4 flex gap-2 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-100 ring-1 ring-rose-300/15">
          <AlertTriangle className="shrink-0" size={17} /> {device.status.lastError}
        </p>
      )}
    </Link>
  );
}
