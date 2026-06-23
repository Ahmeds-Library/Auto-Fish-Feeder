import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface ClaimDeviceInput {
  deviceId: string;
  pairingCode: string;
}

export interface ClaimDeviceResult {
  deviceId: string;
  paired: boolean;
  message: string;
}

export async function claimDevice(input: ClaimDeviceInput): Promise<ClaimDeviceResult> {
  const callable = httpsCallable<ClaimDeviceInput, ClaimDeviceResult>(functions, 'claimDevice');
  const result = await callable({
    deviceId: input.deviceId.trim().toUpperCase(),
    pairingCode: input.pairingCode.trim(),
  });
  return result.data;
}
