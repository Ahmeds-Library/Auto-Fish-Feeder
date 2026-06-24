import { Cpu, Radio, Timer } from 'lucide-react';
import { isOnline, timeAgo } from '../../lib/format';
import { DeviceWithId } from '../../types/schema';
import { AnimatedStatus } from '../motion';
import { GlassCard } from '../ui';

export function DeviceHeader({ device }: { device: DeviceWithId }) {
  const online = isOnline(device.status.lastSeen);
  return (
    <GlassCard className="mb-5 overflow-hidden">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <AnimatedStatus tone={online ? 'success' : 'warning'} label={online ? 'online' : 'offline'} pulse={online} />
          <h2 className="page-heading mt-3">{device.name}</h2>
          <p className="mt-2 break-all text-sm text-slate-400">{device.id}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Chip icon={Cpu} label="Firmware" value={device.status.firmwareVersion || 'unknown'} />
          <Chip icon={Timer} label="Last seen" value={timeAgo(device.status.lastSeen)} />
          <Chip icon={Radio} label="Wi-Fi" value={`${device.status.wifi.rssi ?? '—'} dBm`} />
        </div>
      </div>
    </GlassCard>
  );
}

function Chip({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><Icon className="text-cyan-200" size={16} /><p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-cyan-50">{value}</p></div>;
}
