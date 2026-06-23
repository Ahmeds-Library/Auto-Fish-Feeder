import { FormEvent, ReactNode, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeviceNav, PageTitle } from '../components/Layout';
import { AlertMessage, EmptyState, GlassCard, MetricCard, StatusBadge } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { isOnline, timeAgo } from '../lib/format';
import {
  deleteSchedule,
  saveSchedule,
  sendFeedCommand,
  updateDeviceSettings,
} from '../services/deviceService';
import { DeviceLog, Schedule } from '../types/schema';
import { Activity, AlertTriangle, CalendarClock, Clock, Fish, Gauge, Radio, Settings, SlidersHorizontal } from 'lucide-react';

function useDeviceId() {
  const params = useParams();
  return params.deviceId ?? params.id;
}

function Shell({ children, title }: { children: ReactNode; title: string }) {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);

  return (
    <>
      <PageTitle
        title={title}
        subtitle={device ? `${device.name} • ${device.id}` : 'Loading selected feeder...'}
      />
      {deviceId && <DeviceNav id={deviceId} />}
      <div className="page-enter">{children}</div>
    </>
  );
}

export function OverviewPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);

  if (!device) {
    return (
      <Shell title="Overview">
        <GlassCard>Loading selected feeder...</GlassCard>
      </Shell>
    );
  }

  const online = isOnline(device.status.lastSeen);

  return (
    <Shell title="Device overview">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Gauge} label="Connection" value={online ? 'Online' : 'Offline'} helper={`Last seen ${timeAgo(device.status.lastSeen)}`} delay={0} />
        <MetricCard icon={Fish} label="Last feed" value={timeAgo(device.status.feeding.lastFeedAt)} helper={`${device.status.feeding.todayCount} feeds today`} delay={80} />
        <MetricCard icon={Activity} label="Motor state" value={device.status.motor.state || 'idle'} helper={`${device.status.motor.lastRunDurationMs || 0}ms last run`} delay={160} />
        <MetricCard icon={Radio} label="Wi-Fi RSSI" value={`${device.status.wifi.rssi} dBm`} helper={device.status.wifi.connected ? 'Connected' : 'Disconnected'} delay={240} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <GlassCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Firmware</p>
              <h2 className="section-title mt-1">{device.status.firmwareVersion}</h2>
            </div>
            <StatusBadge tone={device.status.firebase.connected ? 'success' : 'warning'}>
              Firebase {device.status.firebase.connected ? 'synced' : 'offline'}
            </StatusBadge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Active command" value={device.commands?.active?.status || 'idle'} />
            <InfoRow label="Last feed status" value={device.status.feeding.lastFeedStatus || 'unknown'} />
            <InfoRow label="Servo pin" value={device.settings.servoPin} />
            <InfoRow label="Motor type" value={device.settings.motorType} />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Next schedule</p>
          <h2 className="section-title mt-3">Smart schedule preview</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">The firmware reads per-device schedules and prevents duplicate triggers in the same minute.</p>
        </GlassCard>
      </div>

      {device.status.lastError && (
        <div className="mt-5"><AlertMessage tone="danger">{device.status.lastError}</AlertMessage></div>
      )}
    </Shell>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-cyan-50">{value}</p>
    </div>
  );
}

export function FeedPage() {
  const deviceId = useDeviceId();
  const { user } = useAuth();
  const device = useDevice(deviceId);
  const [duration, setDuration] = useState(700);
  const [direction, setDirection] = useState('cw');
  const [status, setStatus] = useState('');

  async function feed() {
    if (!deviceId || !user) return;
    await sendFeedCommand(deviceId, user.uid, {
      motorType: device?.settings.motorType || 'continuous360',
      direction,
      durationMs: duration,
      source: 'manual',
    });
    setStatus(`Feed command written to /devices/${deviceId}/commands/active`);
  }

  return (
    <Shell title="Manual feed">
      <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <GlassCard className="space-y-5">
          <div>
            <p className="badge-info w-fit">Manual command</p>
            <h2 className="section-title mt-3">Feed exactly one selected device</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Feed Now creates a pending per-device command. It writes only the selected device command path.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Direction</span>
              <select className="field" value={direction} onChange={(event) => setDirection(event.target.value)}>
                <option value="cw">Clockwise</option>
                <option value="ccw">Counterclockwise</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Duration ms</span>
              <input className="field" type="number" min="100" max="10000" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {[400, 700, 1200].map((value) => (
              <button className="btn-ghost" onClick={() => setDuration(value)} key={value} type="button">
                {value === 400 ? 'Small' : value === 700 ? 'Medium' : 'Large'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary flex-1" onClick={feed} type="button">Feed Now</button>
            <button className="btn-ghost flex-1" type="button" onClick={() => deviceId && user && sendFeedCommand(deviceId, user.uid, { motorType: device?.settings.motorType || 'continuous360', direction, durationMs: 250, source: 'test' })}>Feed Test</button>
            <button className="btn-danger flex-1" type="button">Emergency Stop</button>
          </div>
          {status && <AlertMessage tone="success">{status}</AlertMessage>}
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-400">Active command status</p>
          <h2 className="section-title mt-2">{device?.commands?.active?.status || 'idle'}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">Commands are executed by firmware, then marked completed or failed under the same device path.</p>
        </GlassCard>
      </div>
    </Shell>
  );
}

export function SchedulesPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);
  const [schedule, setSchedule] = useState<Schedule>({
    enabled: true,
    time: '08:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    feedMode: 'medium',
    motorType: 'continuous360',
    direction: 'cw',
    durationMs: 700,
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (deviceId) await saveSchedule(deviceId, undefined, schedule);
  }

  const schedules = Object.entries(device?.schedules ?? {}) as [string, Schedule][];

  return (
    <Shell title="Schedules">
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={submit} className="card h-fit space-y-4">
          <div>
            <p className="badge-info w-fit">Create schedule</p>
            <h2 className="section-title mt-3">Automate daily feeding</h2>
          </div>
          <label className="block space-y-2"><span className="text-sm font-semibold">Time</span><input className="field" type="time" value={schedule.time} onChange={(event) => setSchedule({ ...schedule, time: event.target.value })} /></label>
          <label className="block space-y-2"><span className="text-sm font-semibold">Feed mode</span><select className="field" value={schedule.feedMode} onChange={(event) => setSchedule({ ...schedule, feedMode: event.target.value as Schedule['feedMode'] })}><option>small</option><option>medium</option><option>large</option><option>custom</option></select></label>
          <label className="block space-y-2"><span className="text-sm font-semibold">Duration ms</span><input className="field" type="number" value={schedule.durationMs} onChange={(event) => setSchedule({ ...schedule, durationMs: Number(event.target.value) })} /></label>
          <button className="btn-primary w-full">Add schedule</button>
        </form>
        <div className="grid gap-3">
          {schedules.length ? schedules.map(([scheduleId, item], index) => (
            <GlassCard className="stagger-item flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: `${index * 80}ms` }} key={scheduleId}>
              <div>
                <StatusBadge tone={item.enabled ? 'success' : 'warning'}>{item.enabled ? 'enabled' : 'paused'}</StatusBadge>
                <h3 className="mt-3 text-2xl font-black">{item.time}</h3>
                <p className="text-sm text-slate-400">{item.days.join(', ')} • {item.feedMode} • {item.durationMs ?? 'default'}ms</p>
              </div>
              <button className="btn-ghost" onClick={() => deviceId && deleteSchedule(deviceId, scheduleId)}>Delete</button>
            </GlassCard>
          )) : <EmptyState icon={CalendarClock} title="No schedules yet" body="Create a per-device schedule to automate feedings safely." />}
        </div>
      </div>
    </Shell>
  );
}

export function MotorSettingsPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);

  if (!device) {
    return (
      <Shell title="Motor settings">
        <GlassCard>Loading motor settings...</GlassCard>
      </Shell>
    );
  }

  const settings = device.settings;

  return (
    <Shell title="Motor settings">
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <p className="badge-info w-fit">Continuous 360</p>
          <h2 className="section-title">Speed + duration control</h2>
          <AlertMessage tone="warning">Continuous servos are controlled by direction, write value/speed, and duration—not precise degrees without feedback hardware.</AlertMessage>
          {(['cwValue', 'ccwValue', 'stopValue', 'defaultDurationMs'] as const).map((key) => (
            <label className="block space-y-2" key={key}>
              <span className="text-sm font-semibold text-slate-200">{key}</span>
              <input className="field" type="number" defaultValue={settings.continuous360[key]} />
            </label>
          ))}
          <button className="btn-primary w-full" onClick={() => deviceId && updateDeviceSettings(deviceId, { 'settings/motorType': 'continuous360' })}>Save continuous mode</button>
        </GlassCard>
        <GlassCard className="space-y-4">
          <p className="badge-info w-fit">Positional servo</p>
          <h2 className="section-title">Angle + hold control</h2>
          {(['minAngle', 'maxAngle', 'restAngle', 'feedAngle', 'holdMs'] as const).map((key) => (
            <label className="block space-y-2" key={key}>
              <span className="text-sm font-semibold text-slate-200">{key}</span>
              <input className="field" type="number" defaultValue={settings.positional[key]} />
            </label>
          ))}
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <input type="checkbox" defaultChecked={settings.positional.returnAfterFeed} /> Return after feed
          </label>
          <button className="btn-primary w-full" onClick={() => deviceId && updateDeviceSettings(deviceId, { 'settings/motorType': 'positional' })}>Save positional mode</button>
        </GlassCard>
      </div>
    </Shell>
  );
}

export function LogsPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);
  const logs = (Object.entries(device?.logs ?? {}) as [string, DeviceLog][]).slice(-100).reverse();

  return (
    <Shell title="Logs">
      <div className="space-y-3">
        {logs.length ? (
          logs.map(([logId, log], index) => (
            <GlassCard className="stagger-item relative ml-4 border-l-2 border-l-cyan-300/30" style={{ animationDelay: `${index * 45}ms` }} key={logId}>
              <span className="absolute -left-[9px] top-7 h-4 w-4 rounded-full bg-cyan-300 shadow-glow" />
              <StatusBadge tone={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : log.level === 'success' ? 'success' : 'info'}>{log.level}</StatusBadge>
              <p className="mt-3 font-semibold text-white">{log.message}</p>
              <p className="text-sm text-slate-400">{timeAgo(log.createdAt)} • {log.source}</p>
            </GlassCard>
          ))
        ) : (
          <EmptyState icon={Clock} title="No logs yet" body="Device and command events will appear here as a live timeline." />
        )}
      </div>
    </Shell>
  );
}

export function DeviceSettingsPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);

  return (
    <Shell title="Device settings">
      <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <GlassCard className="space-y-4">
          <div>
            <p className="badge-info w-fit">Identity</p>
            <h2 className="section-title mt-3">Cloud device profile</h2>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Device name</span>
            <input className="field" defaultValue={device?.name} onBlur={(event) => deviceId && updateDeviceSettings(deviceId, { name: event.target.value })} />
          </label>
          <InfoRow label="Device ID" value={deviceId} />
          <InfoRow label="Owner UID" value={device?.ownerUid || 'Not paired'} />
          <InfoRow label="Firmware" value={device?.status.firmwareVersion || 'Unknown'} />
        </GlassCard>
        <GlassCard className="space-y-4 border-rose-300/20 bg-rose-500/10">
          <AlertTriangle className="text-rose-200" />
          <h2 className="section-title">Danger zone</h2>
          <p className="text-sm leading-6 text-rose-100">Unlink, cloud reset, and factory reset require confirmation and firmware support. Keep destructive actions behind an explicit confirmation flow.</p>
          <button className="btn-danger w-full" type="button">Destructive actions disabled</button>
        </GlassCard>
      </div>
    </Shell>
  );
}
