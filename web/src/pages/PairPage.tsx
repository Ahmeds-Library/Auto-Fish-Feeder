import { FirebaseError } from 'firebase/app';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageTitle } from '../components/Layout';
import { claimDevice } from '../services/pairingService';

function claimErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) return 'Pairing failed. Please try again.';
  if (error.code === 'functions/unauthenticated') return 'Please log in before pairing a device.';
  if (error.code === 'functions/invalid-argument') return (error as FirebaseError).message || 'Check the Device ID and pairing code.';
  if (error.code === 'functions/not-found') return 'No active pairing request was found for this code.';
  if (error.code === 'functions/deadline-exceeded') return 'This pairing code has expired. Generate a new code from the device setup portal.';
  if (error.code === 'functions/already-exists') return 'This device or pairing code has already been claimed.';
  if (error.code === 'functions/permission-denied') return 'This pairing code does not match the selected device.';
  return 'Pairing failed. Please try again.';
}

export function PairPage() {
  const [searchParams] = useSearchParams();
  const [deviceId, setDeviceId] = useState(searchParams.get('deviceId') || '');
  const [pairingCode, setPairingCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const pairingLinkDetected = useMemo(
    () => Boolean(searchParams.get('deviceId') || searchParams.get('code')),
    [searchParams],
  );

  useEffect(() => {
    const queryDeviceId = searchParams.get('deviceId');
    const queryCode = searchParams.get('code');
    if (queryDeviceId) setDeviceId(queryDeviceId.toUpperCase());
    if (queryCode) setPairingCode(queryCode);
  }, [searchParams]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await claimDevice({ deviceId, pairingCode });
      setSuccess(result.message || `Device ${result.deviceId} paired successfully.`);
    } catch (err) {
      setError(claimErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    {
      title: '1. Power on device',
      body: 'Power on your Fish Feeder. If it has not been configured before, it will create a setup Wi-Fi network.',
    },
    {
      title: '2. Connect to setup Wi-Fi',
      body: 'Wi-Fi name: FishFeeder-Setup. Password: setup1234. If the device already has an ID, the network may appear as FishFeeder-FF-XXXXXX.',
    },
    {
      title: '3. Open setup portal',
      body: 'Open http://192.168.4.1 in your browser. The setup portal asks for home Wi-Fi and shows the Device ID and pairing code.',
    },
    {
      title: '4. Enter code or scan QR',
      body: 'Enter the Device ID and 6-digit pairing code shown by the device, or open the pairing URL/QR from the setup portal.',
    },
    {
      title: '5. Claim device',
      body: 'Pairing is completed by a Cloud Function that validates the code, expiry, and current ownership before linking the feeder to your account.',
    },
  ];

  return (
    <>
      <PageTitle
        title="Pair a Fish Feeder"
        subtitle="Guided onboarding for setup Wi-Fi, the local portal, and secure cloud claiming."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-4">
          {pairingLinkDetected && (
            <p className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-100">
              Pairing link detected. Device ID and pairing code were prefilled from the URL.
            </p>
          )}

          <p className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-amber-100">
            Browsers cannot directly scan nearby Wi-Fi setup networks like a native mobile app. Connect to the
            FishFeeder setup Wi-Fi first, then use the setup portal or QR code to pair securely.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step) => (
              <article className="card" key={step.title}>
                <h2 className="text-lg font-bold text-cyan-100">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="card h-fit space-y-4">
          <h2 className="text-2xl font-black">Enter pairing details</h2>
          {success && <p className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-100">{success}</p>}
          {error && <p className="rounded-2xl bg-rose-500/10 p-3 text-rose-200">{error}</p>}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Device ID</span>
            <input
              className="field uppercase"
              required
              placeholder="FF-A84F21"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value.toUpperCase())}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Pairing code</span>
            <input
              className="field tracking-[0.35em]"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="483921"
              value={pairingCode}
              onChange={(event) => setPairingCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <span className="text-xs text-slate-400">Codes are one-time use and expire after about 15 minutes.</span>
          </label>

          <button className="btn-primary w-full" disabled={loading || pairingCode.length !== 6}>
            {loading ? 'Pairing...' : 'Pair this device'}
          </button>
        </form>
      </div>
    </>
  );
}
