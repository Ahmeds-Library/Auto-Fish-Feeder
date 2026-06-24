import { motion, useReducedMotion } from 'framer-motion';
import { Activity, CalendarClock, Clock, Fish, Gauge, LucideIcon, Radio, Settings, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isOnline, timeAgo, wifiQuality } from '../lib/format';
import { DeviceWithId } from '../types/schema';
import { AnimatedStatus } from './motion';

export function DeviceHeader({ device }: { device: DeviceWithId }) {
  const shouldReduceMotion = useReducedMotion();
  const online = isOnline(device.status?.lastSeen);
  const wifi = wifiQuality(device.status?.wifi?.rssi);
  const quickLinks = [
    { to: `/devices/${device.id}/feed`, label: 'Feed', icon: Fish },
    { to: `/devices/${device.id}/schedules`, label: 'Schedules', icon: CalendarClock },
    { to: `/devices/${device.id}/motor-settings`, label: 'Motor', icon: Settings },
  ];

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-[0_24px_80px_rgba(2,8,23,0.35)] backdrop-blur-2xl"
    >
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_95%_5%,rgba(59,130,246,0.14),transparent_30%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <AnimatedStatus tone={online ? 'success' : 'warning'} label={online ? 'Online' : 'Offline'} pulse={online} />
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-300">ID {device.id}</span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">FW {device.status?.firmwareVersion || 'unknown'}</span>
            </div>
            <h1 className="break-words text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">{device.name || 'Fish feeder'}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Device controls are scoped to <span className="font-semibold text-cyan-100">/devices/{device.id}</span>. Use quick actions for feed, scheduling, or calibration.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[32rem]">
            <HeaderMetric icon={Clock} label="Last seen" value={timeAgo(device.status?.lastSeen)} />
            <HeaderMetric icon={Wifi} label="Wi-Fi" value={wifi.value} />
            <HeaderMetric icon={Activity} label="Motor" value={device.status?.motor?.state || 'idle'} />
            <HeaderMetric icon={Fish} label="Last feed" value={timeAgo(device.status?.feeding?.lastFeedAt)} />
            <HeaderMetric icon={Gauge} label="Feeds today" value={device.status?.feeding?.todayCount ?? 0} />
            <HeaderMetric icon={Radio} label="Firebase" value={device.status?.firebase?.connected ? 'Synced' : 'Offline'} />
          </div>
        </div>

        <div className="relative mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="btn-ghost inline-flex min-h-11 items-center justify-center gap-2 px-4">
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function HeaderMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        <Icon size={14} className="shrink-0 text-cyan-200" /> {label}
      </div>
      <p className="mt-1 truncate text-sm font-bold text-cyan-50" title={String(value)}>{value}</p>
    </div>
  );
}
