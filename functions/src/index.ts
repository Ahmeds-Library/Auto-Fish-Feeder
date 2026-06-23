import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

interface ClaimDeviceInput {
  deviceId?: string;
  pairingCode?: string;
}

const DEVICE_ID_PATTERN = /^FF-[A-Z0-9-]{3,32}$/;
const PAIRING_CODE_PATTERN = /^\d{6}$/;

export const claimDevice = onCall<ClaimDeviceInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please log in before pairing a device.');
  }

  const deviceId = String(request.data.deviceId || '').trim().toUpperCase();
  const pairingCode = String(request.data.pairingCode || '').trim();

  if (!DEVICE_ID_PATTERN.test(deviceId) || !PAIRING_CODE_PATTERN.test(pairingCode)) {
    throw new HttpsError('invalid-argument', 'Check the Device ID and 6-digit pairing code.');
  }

  const db = getDatabase();
  const now = Date.now();
  const requestRef = db.ref(`pairingRequests/${pairingCode}`);
  const deviceRef = db.ref(`devices/${deviceId}`);
  const userDeviceRef = db.ref(`users/${request.auth.uid}/devices/${deviceId}`);

  const [pairingSnap, deviceSnap] = await Promise.all([requestRef.get(), deviceRef.get()]);

  if (!pairingSnap.exists()) {
    throw new HttpsError('not-found', 'No active pairing request was found for this code.');
  }

  const pairing = pairingSnap.val() as {
    deviceId?: string;
    expiresAt?: number;
    claimed?: boolean;
  };

  if (String(pairing.deviceId || '').toUpperCase() !== deviceId) {
    throw new HttpsError('permission-denied', 'This pairing code does not match the selected device.');
  }

  if (pairing.claimed) {
    throw new HttpsError('already-exists', 'This pairing code has already been claimed.');
  }

  if (!pairing.expiresAt || pairing.expiresAt < now) {
    throw new HttpsError('deadline-exceeded', 'This pairing code has expired.');
  }

  const device = deviceSnap.val() as { ownerUid?: string | null } | null;
  if (device?.ownerUid) {
    throw new HttpsError('already-exists', 'This device is already paired to an account.');
  }

  const updates: Record<string, unknown> = {
    [`devices/${deviceId}/ownerUid`]: request.auth.uid,
    [`devices/${deviceId}/pairing/paired`]: true,
    [`devices/${deviceId}/pairing/pairedAt`]: now,
    [`users/${request.auth.uid}/devices/${deviceId}`]: true,
    [`pairingRequests/${pairingCode}/claimed`]: true,
    [`pairingRequests/${pairingCode}/claimedAt`]: now,
    [`pairingRequests/${pairingCode}/claimedBy`]: request.auth.uid,
  };

  await db.ref().update(updates);

  return {
    paired: true,
    deviceId,
    message: `Device ${deviceId} paired successfully.`,
  };
});
