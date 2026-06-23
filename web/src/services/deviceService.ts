import { push, ref, remove, set, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { CommandType, DeviceCommand, Direction, MotorType, Schedule } from '../types/schema';

export type CommandPayload = Record<string, unknown>;

export interface DeviceCommandInput {
  type: Exclude<CommandType, 'none'>;
  payload?: CommandPayload;
}

function commandId() {
  return `CMD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function sendDeviceCommand(deviceId: string, uid: string, command: DeviceCommandInput) {
  const now = Date.now();
  const cmd: DeviceCommand = {
    id: commandId(),
    type: command.type,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
    payload: command.payload ?? {},
  };
  return set(ref(db, `devices/${deviceId}/commands/active`), cmd);
}

export function sendFeedCommand(
  deviceId: string,
  uid: string,
  payload: { motorType: MotorType; direction: Direction; durationMs: number; source?: string },
) {
  return sendDeviceCommand(deviceId, uid, {
    type: 'feed',
    payload: { ...payload, source: payload.source ?? 'manual' },
  });
}

export function sendTestMotorCommand(
  deviceId: string,
  uid: string,
  payload: { motorType: MotorType; direction?: Direction; durationMs?: number; angle?: number; target?: string; source?: string },
) {
  return sendDeviceCommand(deviceId, uid, {
    type: 'test_motor',
    payload: { durationMs: 250, source: 'test', ...payload },
  });
}

export function sendEmergencyStopCommand(deviceId: string, uid: string) {
  return sendDeviceCommand(deviceId, uid, {
    type: 'emergency_stop',
    payload: { source: 'manual' },
  });
}

export function sendSyncSettingsCommand(deviceId: string, uid: string) {
  return sendDeviceCommand(deviceId, uid, {
    type: 'sync_settings',
    payload: { source: 'dashboard' },
  });
}

export function saveSchedule(deviceId: string, id: string | undefined, schedule: Schedule) {
  return id ? set(ref(db, `devices/${deviceId}/schedules/${id}`), schedule) : set(push(ref(db, `devices/${deviceId}/schedules`)), schedule);
}

export function updateSchedule(deviceId: string, id: string, patch: Partial<Schedule>) {
  return update(ref(db, `devices/${deviceId}/schedules/${id}`), patch);
}

export function deleteSchedule(deviceId: string, id: string) {
  return remove(ref(db, `devices/${deviceId}/schedules/${id}`));
}

export function updateDeviceSettings(deviceId: string, patch: Record<string, unknown>) {
  return update(ref(db, `devices/${deviceId}`), patch);
}
