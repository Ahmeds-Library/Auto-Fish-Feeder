import { FormEvent, ReactNode, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeviceNav, PageTitle } from '../components/Layout';
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
      {children}
    </>
  );
}

export function OverviewPage() {
  const deviceId = useDeviceId();
  const device = useDevice(deviceId);

  if (!device) {
    return (
      <Shell title="Overview">
        <div className="card">Loading...</div>
      </Shell>
    );
  }

  const cards = [
    ['Online', isOnline(device.status.lastSeen) ? 'Online' : 'Offline'],
    ['Last seen', timeAgo(device.status.lastSeen)],
    ['Last feed', timeAgo(device.status.feeding.lastFeedAt)],
    ['Today feeds', String(device.status.feeding.todayCount)],
    ['Motor', device.status.motor.state],
    ['Wi-Fi RSSI', `${device.status.wifi.rssi} dBm`],
    ['Firmware', device.status.firmwareVersion],
    ['Next schedule', 'Phase 1 placeholder'],
  ];

  return (
    <Shell title="Device overview">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div className="card" key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <b className="text-2xl">{value}</b>
          </div>
        ))}
      </div>
      {device.status.lastError && (
        <p className="mt-4 rounded-3xl bg-rose-500/10 p-5 text-rose-100">
          {device.status.lastError}
        </p>
      )}
    </Shell>
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
      <div className="card max-w-2xl space-y-4">
        <p className="text-slate-300">
          Feed Now creates a pending per-device command. It writes only the selected device command path.
        </p>
        <select className="field" value={direction} onChange={(event) => setDirection(event.target.value)}>
          <option value="cw">Clockwise</option>
          <option value="ccw">Counterclockwise</option>
        </select>
        <input
          className="field"
          type="number"
          min="100"
          max="10000"
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
        <div className="flex flex-wrap gap-2">
          {[400, 700, 1200].map((value) => (
            <button className="btn-ghost" onClick={() => setDuration(value)} key={value} type="button">
              {value === 400 ? 'Small' : value === 700 ? 'Medium' : 'Large'}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={feed} type="button">
          Feed Now
        </button>
        <button
          className="btn-ghost"
          type="button"
          onClick={() =>
            deviceId &&
            user &&
            sendFeedCommand(deviceId, user.uid, {
              motorType: device?.settings.motorType || 'continuous360',
              direction,
              durationMs: 250,
              source: 'test',
            })
          }
        >
          Feed Test
        </button>
        <button className="btn-ghost" type="button">
          Emergency Stop placeholder
        </button>
        {status && <p className="badge-ok inline-block">{status}</p>}
        <p>
          Active status: <b>{device?.commands?.active?.status || 'idle'}</b>
        </p>
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
      <form onSubmit={submit} className="card mb-4 grid gap-3 md:grid-cols-4">
        <input
          className="field"
          type="time"
          value={schedule.time}
          onChange={(event) => setSchedule({ ...schedule, time: event.target.value })}
        />
        <select
          className="field"
          value={schedule.feedMode}
          onChange={(event) =>
            setSchedule({ ...schedule, feedMode: event.target.value as Schedule['feedMode'] })
          }
        >
          <option>small</option>
          <option>medium</option>
          <option>large</option>
          <option>custom</option>
        </select>
        <input
          className="field"
          type="number"
          value={schedule.durationMs}
          onChange={(event) => setSchedule({ ...schedule, durationMs: Number(event.target.value) })}
        />
        <button className="btn-primary">Add schedule</button>
      </form>
      <div className="grid gap-3">
        {schedules.map(([scheduleId, item]) => (
          <div className="card flex items-center justify-between" key={scheduleId}>
            <div>
              <b>{item.time}</b>
              <p className="text-sm text-slate-400">
                {item.days.join(', ')} • {item.feedMode}
              </p>
            </div>
            <button className="btn-ghost" onClick={() => deviceId && deleteSchedule(deviceId, scheduleId)}>
              Delete
            </button>
          </div>
        ))}
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
        <div className="card">Loading...</div>
      </Shell>
    );
  }

  const settings = device.settings;

  return (
    <Shell title="Motor settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-xl font-bold">360 continuous servo</h2>
          <p className="text-sm text-slate-300">
            Continuous servos are controlled by direction, write value/speed, and duration—not
            precise degrees without feedback hardware.
          </p>
          {(['cwValue', 'ccwValue', 'stopValue', 'defaultDurationMs'] as const).map((key) => (
            <label className="block" key={key}>
              {key}
              <input className="field" type="number" defaultValue={settings.continuous360[key]} />
            </label>
          ))}
          <button
            className="btn-primary"
            onClick={() => deviceId && updateDeviceSettings(deviceId, { 'settings/motorType': 'continuous360' })}
          >
            Save continuous mode
          </button>
        </div>
        <div className="card space-y-3">
          <h2 className="text-xl font-bold">Positional servo</h2>
          {(['minAngle', 'maxAngle', 'restAngle', 'feedAngle', 'holdMs'] as const).map((key) => (
            <label className="block" key={key}>
              {key}
              <input className="field" type="number" defaultValue={settings.positional[key]} />
            </label>
          ))}
          <label className="flex gap-2">
            <input type="checkbox" defaultChecked={settings.positional.returnAfterFeed} /> Return after feed
          </label>
          <button
            className="btn-primary"
            onClick={() => deviceId && updateDeviceSettings(deviceId, { 'settings/motorType': 'positional' })}
          >
            Save positional mode
          </button>
        </div>
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
          logs.map(([logId, log]) => (
            <div className="card" key={logId}>
              <span
                className={
                  log.level === 'error'
                    ? 'badge-danger'
                    : log.level === 'warning'
                      ? 'badge-warn'
                      : 'badge-ok'
                }
              >
                {log.level}
              </span>
              <p className="mt-3 font-semibold">{log.message}</p>
              <p className="text-sm text-slate-400">
                {timeAgo(log.createdAt)} • {log.source}
              </p>
            </div>
          ))
        ) : (
          <div className="card">No logs yet.</div>
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
      <div className="card max-w-2xl space-y-4">
        <input
          className="field"
          defaultValue={device?.name}
          onBlur={(event) => deviceId && updateDeviceSettings(deviceId, { name: event.target.value })}
        />
        <p>
          Device ID: <b>{deviceId}</b>
        </p>
        <p>
          Owner UID: <b>{device?.ownerUid}</b>
        </p>
        <p>
          Firmware: <b>{device?.status.firmwareVersion}</b>
        </p>
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4">
          <b>Danger zone</b>
          <p className="text-sm text-rose-100">
            Unlink, cloud reset, and factory reset require confirmation and Phase 2 firmware support.
          </p>
        </div>
      </div>
    </Shell>
  );
}
