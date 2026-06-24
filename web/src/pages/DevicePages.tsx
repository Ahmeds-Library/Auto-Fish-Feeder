import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ActiveCommandStatus } from '../components/ActiveCommandStatus';
import { DeviceNav } from '../components/Layout';
import { DeviceHeader } from '../components/DeviceHeader';
import { AlertMessage, EmptyState, GlassCard, MetricCard, PrimaryButton, SecondaryButton, StatusBadge, TimelineItem } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { isOnline, timeAgo } from '../lib/format';
import {
  deleteSchedule,
  saveSchedule,
  sendEmergencyStopCommand,
  sendFeedCommand,
  sendSyncSettingsCommand,
  sendTestMotorCommand,
  updateDeviceSettings,
  updateSchedule,
} from '../services/deviceService';
import { DeviceLog, Direction, MotorType, Schedule } from '../types/schema';
import { Activity, AlertTriangle, CalendarClock, Clock, Fish, Gauge, Radio, RefreshCw, Save } from 'lucide-react';

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function useDeviceId() {
  const params = useParams();
  return params.deviceId ?? params.id;
}

function Shell({ children, title }: { children: ReactNode; title: string }) {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);

  return (
    <>
      {device ? <DeviceHeader device={device} /> : (
        <div className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-slate-300 backdrop-blur-xl">
          Loading selected feeder for {title.toLowerCase()}...
        </div>
      )}
      {deviceId && <DeviceNav id={deviceId} />}
      <div className="page-enter">{children}</div>
    </>
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

function normalizeSettings(device: NonNullable<ReturnType<typeof useDevice>>) {
  return device.settings;
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
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
        <ActiveCommandStatus command={device.commands?.active} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.85fr]">
        <GlassCard>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Next schedule</p>
          <h2 className="section-title mt-3">Smart schedule preview</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">The firmware reads per-device schedules and prevents duplicate triggers in the same minute.</p>
        </GlassCard>
        {device.status.lastError ? <AlertMessage tone="danger">{device.status.lastError}</AlertMessage> : <AlertMessage tone="success">No device error is currently reported.</AlertMessage>}
      </div>
    </Shell>
  );
}

export function FeedPage() {
  const deviceId = useDeviceId();
  const { user } = useAuth();
  const device = useDevice(deviceId);
  const [duration, setDuration] = useState(700);
  const [direction, setDirection] = useState<Direction>('cw');
  const [busy, setBusy] = useState<'feed' | 'test' | 'stop' | 'sync' | ''>('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function runCommand(kind: 'feed' | 'test' | 'stop' | 'sync') {
    if (!deviceId || !user) return;
    setBusy(kind);
    setSuccess('');
    setError('');
    try {
      const motorType = device?.settings.motorType || 'continuous360';
      if (kind === 'feed') await sendFeedCommand(deviceId, user.uid, { motorType, direction, durationMs: duration, source: 'manual' });
      if (kind === 'test') await sendTestMotorCommand(deviceId, user.uid, { motorType, direction, durationMs: 250, source: 'test' });
      if (kind === 'stop') await sendEmergencyStopCommand(deviceId, user.uid);
      if (kind === 'sync') await sendSyncSettingsCommand(deviceId, user.uid);
      setSuccess('Command sent. Waiting for device confirmation.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write command to Firebase.');
    } finally {
      setBusy('');
    }
  }

  return (
    <Shell title="Manual feed">
      <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <GlassCard className="space-y-5 motion-glow">
          <div>
            <p className="badge-info w-fit">Primary command</p>
            <h2 className="display-title mt-3 max-w-2xl">Feed exactly one selected device</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Feed Now creates a pending per-device command. It writes only to <code>/devices/{deviceId}/commands/active</code>.</p>
          </div>
          {success && <AlertMessage tone="success">{success}</AlertMessage>}
          {error && <AlertMessage tone="danger">{error}</AlertMessage>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Direction</span>
              <select className="field" value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
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
              <SecondaryButton onClick={() => setDuration(value)} key={value} type="button" disabled={Boolean(busy)}>
                {value === 400 ? 'Small' : value === 700 ? 'Medium' : 'Large'} · {value}ms
              </SecondaryButton>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PrimaryButton loading={busy === 'feed'} disabled={Boolean(busy)} onClick={() => runCommand('feed')} type="button">Feed Now</PrimaryButton>
            <SecondaryButton disabled={Boolean(busy)} onClick={() => runCommand('test')} type="button">{busy === 'test' ? 'Sending...' : 'Feed Test'}</SecondaryButton>
            <SecondaryButton disabled={Boolean(busy)} onClick={() => runCommand('sync')} type="button"><RefreshCw size={16} /> Sync Settings</SecondaryButton>
            <button className="btn-danger min-h-11" disabled={Boolean(busy)} type="button" onClick={() => runCommand('stop')}>{busy === 'stop' ? 'Stopping...' : 'Emergency Stop'}</button>
          </div>
        </GlassCard>
        <ActiveCommandStatus command={device?.commands?.active} />
      </div>
    </Shell>
  );
}

function defaultSchedule(): Schedule {
  return {
    enabled: true,
    time: '08:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    feedMode: 'medium',
    motorType: 'continuous360',
    direction: 'cw',
    durationMs: 700,
    lastTriggeredKey: '',
  };
}

export function SchedulesPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule());
  const [editingId, setEditingId] = useState<string | undefined>();
  const [busy, setBusy] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function toggleDay(day: string) {
    setSchedule((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day],
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!deviceId) return;
    setBusy('save');
    setError('');
    setSuccess('');
    try {
      if (!schedule.days.length) throw new Error('Select at least one day.');
      if (!/^\d{2}:\d{2}$/.test(schedule.time)) throw new Error('Enter a valid HH:MM time.');
      if (schedule.durationMs < 100 || schedule.durationMs > 10000) throw new Error('Duration must be between 100 and 10000 ms.');
      await saveSchedule(deviceId, editingId, schedule);
      setSuccess(editingId ? 'Schedule updated.' : 'Schedule created.');
      setEditingId(undefined);
      setSchedule(defaultSchedule());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save schedule.');
    } finally {
      setBusy('');
    }
  }

  async function toggleEnabled(scheduleId: string, enabled: boolean) {
    if (!deviceId) return;
    setBusy(scheduleId);
    setError('');
    setSuccess('');
    try {
      await updateSchedule(deviceId, scheduleId, { enabled: !enabled });
      setSuccess(`Schedule ${enabled ? 'paused' : 'enabled'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update schedule.');
    } finally {
      setBusy('');
    }
  }

  async function removeSchedule(scheduleId: string) {
    if (!deviceId) return;
    setBusy(scheduleId);
    setError('');
    setSuccess('');
    try {
      await deleteSchedule(deviceId, scheduleId);
      setSuccess('Schedule deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete schedule.');
    } finally {
      setBusy('');
    }
  }

  const schedules = Object.entries(device?.schedules ?? {}) as [string, Schedule][];

  return (
    <Shell title="Schedules">
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={submit} className="card h-fit space-y-4">
          <div>
            <p className="badge-info w-fit">{editingId ? 'Edit schedule' : 'Create schedule'}</p>
            <h2 className="section-title mt-3">Automate daily feeding</h2>
          </div>
          {success && <AlertMessage tone="success">{success}</AlertMessage>}
          {error && <AlertMessage tone="danger">{error}</AlertMessage>}
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <span className="text-sm font-semibold">Enabled</span>
            <input type="checkbox" checked={schedule.enabled} onChange={(event) => setSchedule({ ...schedule, enabled: event.target.checked })} />
          </label>
          <label className="block space-y-2"><span className="text-sm font-semibold">Time</span><input className="field" type="time" value={schedule.time} onChange={(event) => setSchedule({ ...schedule, time: event.target.value })} /></label>
          <div>
            <span className="text-sm font-semibold">Days</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {days.map((day) => <button className={schedule.days.includes(day) ? 'navlink navlink-active' : 'navlink'} type="button" onClick={() => toggleDay(day)} key={day}>{day}</button>)}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2"><span className="text-sm font-semibold">Feed mode</span><select className="field" value={schedule.feedMode} onChange={(event) => setSchedule({ ...schedule, feedMode: event.target.value as Schedule['feedMode'] })}><option value="small">small</option><option value="medium">medium</option><option value="large">large</option><option value="custom">custom</option></select></label>
            <label className="block space-y-2"><span className="text-sm font-semibold">Motor type</span><select className="field" value={schedule.motorType} onChange={(event) => setSchedule({ ...schedule, motorType: event.target.value as MotorType })}><option value="continuous360">continuous360</option><option value="positional">positional</option></select></label>
            <label className="block space-y-2"><span className="text-sm font-semibold">Direction</span><select className="field" value={schedule.direction} onChange={(event) => setSchedule({ ...schedule, direction: event.target.value as Direction })}><option value="cw">cw</option><option value="ccw">ccw</option></select></label>
            <label className="block space-y-2"><span className="text-sm font-semibold">Duration ms</span><input className="field" type="number" min="100" max="10000" value={schedule.durationMs} onChange={(event) => setSchedule({ ...schedule, durationMs: Number(event.target.value) })} /></label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryButton className="flex-1" loading={busy === 'save'}>{editingId ? 'Update schedule' : 'Add schedule'}</PrimaryButton>
            <SecondaryButton className="flex-1" type="button" onClick={() => { setEditingId(undefined); setSchedule(defaultSchedule()); }}>Clear form</SecondaryButton>
          </div>
        </form>
        <div className="grid gap-3">
          {schedules.length ? schedules.map(([scheduleId, item], index) => (
            <GlassCard className="stagger-item space-y-4" style={{ animationDelay: `${index * 80}ms` }} key={scheduleId}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <StatusBadge tone={item.enabled ? 'success' : 'warning'}>{item.enabled ? 'enabled' : 'paused'}</StatusBadge>
                  <h3 className="mt-3 text-3xl font-black">{item.time}</h3>
                  <p className="text-sm text-slate-400">{item.feedMode} • {item.motorType} • {item.direction} • {item.durationMs}ms</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton disabled={busy === scheduleId} type="button" onClick={() => toggleEnabled(scheduleId, item.enabled)}>{item.enabled ? 'Pause' : 'Enable'}</SecondaryButton>
                  <SecondaryButton type="button" onClick={() => { setEditingId(scheduleId); setSchedule({ ...defaultSchedule(), ...item }); }}>Edit</SecondaryButton>
                  <button className="btn-danger min-h-11" disabled={busy === scheduleId} onClick={() => removeSchedule(scheduleId)} type="button">Delete</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">{item.days.map((day) => <span className="badge-info" key={day}>{day}</span>)}</div>
              {item.lastTriggeredKey && <p className="text-xs text-slate-500">Last triggered: {item.lastTriggeredKey}</p>}
            </GlassCard>
          )) : <EmptyState icon={CalendarClock} title="No schedules yet" body="Create a per-device schedule to automate feedings safely." />}
        </div>
      </div>
    </Shell>
  );
}

interface MotorForm {
  motorType: MotorType;
  cwValue: number;
  ccwValue: number;
  stopValue: number;
  defaultDirection: Direction;
  defaultDurationMs: number;
  maxRunMs: number;
  minAngle: number;
  maxAngle: number;
  restAngle: number;
  feedAngle: number;
  returnAfterFeed: boolean;
  holdMs: number;
}

const defaultMotorForm: MotorForm = {
  motorType: 'continuous360',
  cwValue: 0,
  ccwValue: 180,
  stopValue: 90,
  defaultDirection: 'cw',
  defaultDurationMs: 700,
  maxRunMs: 10000,
  minAngle: 0,
  maxAngle: 180,
  restAngle: 90,
  feedAngle: 0,
  returnAfterFeed: true,
  holdMs: 700,
};

export function MotorSettingsPage() {
  const deviceId = useDeviceId();
  const { user } = useAuth();
  const device = useDevice(deviceId);
  const [form, setForm] = useState<MotorForm>(defaultMotorForm);
  const [busy, setBusy] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!device) return;
    const settings = normalizeSettings(device);
    setForm({
      motorType: settings.motorType,
      cwValue: settings.continuous360.cwValue,
      ccwValue: settings.continuous360.ccwValue,
      stopValue: settings.continuous360.stopValue,
      defaultDirection: settings.continuous360.defaultDirection,
      defaultDurationMs: settings.continuous360.defaultDurationMs,
      maxRunMs: settings.safety.maxRunMs,
      minAngle: settings.positional.minAngle,
      maxAngle: settings.positional.maxAngle,
      restAngle: settings.positional.restAngle,
      feedAngle: settings.positional.feedAngle,
      returnAfterFeed: settings.positional.returnAfterFeed,
      holdMs: settings.positional.holdMs,
    });
  }, [device]);

  if (!device) {
    return (
      <Shell title="Motor settings">
        <GlassCard>Loading motor settings...</GlassCard>
      </Shell>
    );
  }

  function setNumber(key: keyof MotorForm, value: number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const angleKeys: (keyof MotorForm)[] = ['cwValue', 'ccwValue', 'stopValue', 'minAngle', 'maxAngle', 'restAngle', 'feedAngle'];
    for (const key of angleKeys) {
      const value = form[key];
      if (typeof value !== 'number' || value < 0 || value > 180) return `${String(key)} must be between 0 and 180.`;
    }
    if (form.defaultDurationMs < 100 || form.defaultDurationMs > 10000) return 'Default duration must be between 100 and 10000 ms.';
    if (form.holdMs < 100 || form.holdMs > 10000) return 'Hold time must be between 100 and 10000 ms.';
    if (form.maxRunMs < 100 || form.maxRunMs > 10000) return 'Max run must be between 100 and 10000 ms.';
    if (!['cw', 'ccw'].includes(form.defaultDirection)) return 'Default direction must be cw or ccw.';
    if (form.minAngle > form.maxAngle) return 'Minimum angle must be less than or equal to maximum angle.';
    if (form.feedAngle < form.minAngle || form.feedAngle > form.maxAngle) return 'Feed angle must be inside the min/max range.';
    if (form.restAngle < form.minAngle || form.restAngle > form.maxAngle) return 'Rest angle must be inside the min/max range.';
    return '';
  }

  async function save(mode: MotorType) {
    if (!deviceId) return;
    const validation = validate();
    if (validation) {
      setError(validation);
      setSuccess('');
      return;
    }
    setBusy(mode);
    setError('');
    setSuccess('');
    try {
      const patch: Record<string, unknown> = {
        'settings/motorType': mode,
        'settings/safety/maxRunMs': form.maxRunMs,
      };
      if (mode === 'continuous360') {
        Object.assign(patch, {
          'settings/continuous360/cwValue': form.cwValue,
          'settings/continuous360/ccwValue': form.ccwValue,
          'settings/continuous360/stopValue': form.stopValue,
          'settings/continuous360/defaultDirection': form.defaultDirection,
          'settings/continuous360/defaultDurationMs': form.defaultDurationMs,
        });
      } else {
        Object.assign(patch, {
          'settings/positional/minAngle': form.minAngle,
          'settings/positional/maxAngle': form.maxAngle,
          'settings/positional/restAngle': form.restAngle,
          'settings/positional/feedAngle': form.feedAngle,
          'settings/positional/returnAfterFeed': form.returnAfterFeed,
          'settings/positional/holdMs': form.holdMs,
        });
      }
      await updateDeviceSettings(deviceId, patch);
      if (user) await sendSyncSettingsCommand(deviceId, user.uid);
      setSuccess('Motor calibration saved. Sync settings command sent to the device.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save motor settings.');
    } finally {
      setBusy('');
    }
  }

  async function runTest(kind: 'cw' | 'ccw' | 'stop' | 'feedAngle' | 'restAngle') {
    if (!deviceId || !user) return;
    setBusy(kind);
    setError('');
    setSuccess('');
    try {
      if (kind === 'stop') await sendEmergencyStopCommand(deviceId, user.uid);
      else if (kind === 'feedAngle') await sendTestMotorCommand(deviceId, user.uid, { motorType: 'positional', angle: form.feedAngle, target: 'feedAngle', source: 'calibration' });
      else if (kind === 'restAngle') await sendTestMotorCommand(deviceId, user.uid, { motorType: 'positional', angle: form.restAngle, target: 'restAngle', source: 'calibration' });
      else await sendTestMotorCommand(deviceId, user.uid, { motorType: 'continuous360', direction: kind, durationMs: 250, source: 'calibration' });
      setSuccess('Test command sent. Watch the device and command status for confirmation.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send test command.');
    } finally {
      setBusy('');
    }
  }

  return (
    <Shell title="Motor settings">
      <div className="mb-5 space-y-3">
        {success && <AlertMessage tone="success">{success}</AlertMessage>}
        {error && <AlertMessage tone="danger">{error}</AlertMessage>}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <p className="badge-info w-fit">Continuous 360</p>
          <h2 className="section-title">Speed + duration control</h2>
          <AlertMessage tone="warning">360 continuous servos are controlled by direction, write value, and duration—not exact degrees.</AlertMessage>
          <NumberInput label="CW write value" value={form.cwValue} min={0} max={180} onChange={(value) => setNumber('cwValue', value)} />
          <NumberInput label="CCW write value" value={form.ccwValue} min={0} max={180} onChange={(value) => setNumber('ccwValue', value)} />
          <NumberInput label="Stop write value" value={form.stopValue} min={0} max={180} onChange={(value) => setNumber('stopValue', value)} />
          <label className="block space-y-2"><span className="text-sm font-semibold text-slate-200">Default direction</span><select className="field" value={form.defaultDirection} onChange={(event) => setForm({ ...form, defaultDirection: event.target.value as Direction })}><option value="cw">cw</option><option value="ccw">ccw</option></select></label>
          <NumberInput label="Default duration ms" value={form.defaultDurationMs} min={100} max={10000} onChange={(value) => setNumber('defaultDurationMs', value)} />
          <NumberInput label="Safety max run ms" value={form.maxRunMs} min={100} max={10000} onChange={(value) => setNumber('maxRunMs', value)} />
          <div className="grid gap-2 sm:grid-cols-3">
            <SecondaryButton type="button" onClick={() => runTest('cw')} disabled={Boolean(busy)}>Test CW</SecondaryButton>
            <SecondaryButton type="button" onClick={() => runTest('ccw')} disabled={Boolean(busy)}>Test CCW</SecondaryButton>
            <button className="btn-danger min-h-11" type="button" onClick={() => runTest('stop')} disabled={Boolean(busy)}>Test Stop</button>
          </div>
          <PrimaryButton className="w-full" loading={busy === 'continuous360'} onClick={() => save('continuous360')}>Save continuous mode</PrimaryButton>
        </GlassCard>
        <GlassCard className="space-y-4">
          <p className="badge-info w-fit">Positional servo</p>
          <h2 className="section-title">Angle + hold control</h2>
          <NumberInput label="Min angle" value={form.minAngle} min={0} max={180} onChange={(value) => setNumber('minAngle', value)} />
          <NumberInput label="Max angle" value={form.maxAngle} min={0} max={180} onChange={(value) => setNumber('maxAngle', value)} />
          <NumberInput label="Rest angle" value={form.restAngle} min={0} max={180} onChange={(value) => setNumber('restAngle', value)} />
          <NumberInput label="Feed angle" value={form.feedAngle} min={0} max={180} onChange={(value) => setNumber('feedAngle', value)} />
          <NumberInput label="Hold ms" value={form.holdMs} min={100} max={10000} onChange={(value) => setNumber('holdMs', value)} />
          <NumberInput label="Safety max run ms" value={form.maxRunMs} min={100} max={10000} onChange={(value) => setNumber('maxRunMs', value)} />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <input type="checkbox" checked={form.returnAfterFeed} onChange={(event) => setForm({ ...form, returnAfterFeed: event.target.checked })} /> Return after feed
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <SecondaryButton type="button" onClick={() => runTest('feedAngle')} disabled={Boolean(busy)}>Test Feed Angle</SecondaryButton>
            <SecondaryButton type="button" onClick={() => runTest('restAngle')} disabled={Boolean(busy)}>Test Rest Angle</SecondaryButton>
          </div>
          <PrimaryButton className="w-full" loading={busy === 'positional'} onClick={() => save('positional')}>Save positional mode</PrimaryButton>
        </GlassCard>
      </div>
    </Shell>
  );
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold text-slate-200">{label}</span><input className="field" type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function LogsPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);
  const [level, setLevel] = useState<'all' | DeviceLog['level']>('all');
  const logs = (Object.entries(device?.logs ?? {}) as [string, DeviceLog][])
    .filter(([, log]) => level === 'all' || log.level === level)
    .slice(-100)
    .reverse();

  return (
    <Shell title="Logs">
      <div className="mb-5 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04] p-2">
        {(['all', 'info', 'success', 'warning', 'error', 'command'] as const).map((item) => (
          <button key={item} className={level === item ? 'navlink navlink-active whitespace-nowrap' : 'navlink whitespace-nowrap'} onClick={() => setLevel(item)} type="button">{item}</button>
        ))}
      </div>
      <div className="space-y-3">
        {logs.length ? (
          logs.map(([logId, log], index) => (
            <TimelineItem key={logId} title={log.level} tone={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : log.level === 'success' ? 'success' : 'info'} meta={`${timeAgo(log.createdAt)} • ${log.source}`} delay={index * 45}>
              {log.message}
            </TimelineItem>
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
        <GlassCard className="space-y-4">
          <p className="badge-info w-fit">Safety</p>
          <h2 className="section-title mt-3">Runtime guardrails</h2>
          <InfoRow label="Timezone offset" value={`${device?.settings.timezoneOffsetSeconds ?? 0} seconds`} />
          <InfoRow label="Max motor run" value={`${device?.settings.safety.maxRunMs ?? 0} ms`} />
          <InfoRow label="Emergency stop" value={device?.settings.safety.emergencyStopEnabled ? 'Enabled' : 'Disabled'} />
        </GlassCard>
        <GlassCard className="space-y-4 border-rose-300/20 bg-rose-500/10 lg:col-span-2">
          <AlertTriangle className="text-rose-200" />
          <h2 className="section-title">Danger zone</h2>
          <p className="text-sm leading-6 text-rose-100">Unlink, cloud reset, and factory reset require confirmation and firmware support. Keep destructive actions behind an explicit confirmation flow.</p>
          <button className="btn-danger w-full" type="button">Destructive actions disabled</button>
        </GlassCard>
      </div>
    </Shell>
  );
}
