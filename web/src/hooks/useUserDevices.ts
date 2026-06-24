import { get, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { DeviceWithId } from '../types/schema';

const fleetLoadError = 'Could not load your devices. Check Firebase rules or connection.';

export function useUserDevices(uid?: string) {
  const [devices, setDevices] = useState<DeviceWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    if (!uid) {
      setDevices([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsubscribe = onValue(
      ref(db, `users/${uid}/devices`),
      async (snap) => {
        try {
          const raw = snap.val() || {};
          const ids = Object.keys(raw).filter((id) => raw[id]);

          if (!ids.length) {
            if (!mounted) return;
            setDevices([]);
            setError('');
            setLoading(false);
            return;
          }

          const loaded = await Promise.all(
            ids.map(async (id) => {
              try {
                const deviceSnap = await get(ref(db, `devices/${id}`));
                return deviceSnap.exists() ? ({ id, ...deviceSnap.val() } as DeviceWithId) : null;
              } catch {
                return null;
              }
            }),
          );

          if (!mounted) return;
          setDevices(loaded.filter(Boolean) as DeviceWithId[]);
          setError('');
          setLoading(false);
        } catch {
          if (!mounted) return;
          setDevices([]);
          setError(fleetLoadError);
          setLoading(false);
        }
      },
      () => {
        if (!mounted) return;
        setDevices([]);
        setError(fleetLoadError);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [uid]);

  return { devices, loading, error };
}
