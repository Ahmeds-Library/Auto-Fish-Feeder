import { FirebaseError } from 'firebase/app';
import { CheckCircle2, Copy, KeyRound, QrCode, Router, Smartphone, Wifi } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageTitle } from '../components/Layout';
import { AlertMessage } from '../components/ui';
import { claimDevice } from '../services/pairingService';

function claimErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) return 'Pairing failed. Please try again.';
  if (error.code === 'functions/unauthenticated') return 'Please log in before pairing a device.';
  if (error.code === 'functions/invalid-argument') return error.message || 'Check the Device ID and pairing code.';
  if (error.code === 'functions/not-found') return 'No active pairing request was found for this code.';
  if (error.code === 'functions/deadline-exceeded') return 'This pairing code has expired. Generate a new code from the device setup portal.';
  if (error.code === 'functions/already-exists') return 'This device or pairing code has already been claimed.';
  if (error.code === 'functions/permission-denied') return 'This pairing code does not match the selected device.';
  return 'Pairing failed. Please try again.';
}

const steps = [
  {
    title: 'Power on device',
    body: 'Power on your Fish Feeder. If it has not been configured before, it will create a setup Wi-Fi network.',
    icon: Smartphone,
  },
  {
    title: 'Connect to setup Wi-Fi',
    body: 'Wi-Fi name: FishFeeder-Setup. Password: setup1234. If the device already has an ID, the network may appear as FishFeeder-FF-XXXXXX.',
    icon: Wifi,
  },
  {
    title: 'Open setup portal',
    body: 'Open http://192.168.4.1 in your browser. The setup portal asks for home Wi-Fi and shows the Device ID and pairing code.',
    icon: Router,
  },
  {
    title: 'Enter code or scan QR',
    body: 'Enter the Device ID and 6-digit pairing code shown by the device, or open the pairing URL/QR from the setup portal.',
    icon: QrCode,
  },
  {
    title: 'Claim device',
    body: 'A Cloud Function validates the code, expiry, and current ownership before linking the feeder to your account.',
    icon: CheckCircle2,
  },
];

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

  const readyToPair = deviceId.trim().length >= 5 && pairingCode.length === 6;

  return (
    <>
      <PageTitle
        title="Pair a Fish Feeder"
        subtitle="A guided onboarding flow for setup Wi-Fi, the local portal, pairing codes, and secure cloud claiming."
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <div className="card overflow-hidden p-0">
            <div className="border-b border-white/10 bg-cyan-300/10 p-5">
              <p className="badge-info">Guided setup</p>
              <h2 className="mt-3 text-2xl font-black">From hardware setup to cloud ownership</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Follow these steps once per feeder. After claiming, the device is locked to your Firebase user until removed.</p>
            </div>
            <div className="grid gap-0 md:grid-cols-5">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article className="border-b border-white/10 p-5 md:border-b-0 md:border-r last:md:border-r-0" key={step.title}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/20"><Icon size={20} /></span>
                      <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">0{index + 1}</span>
                    </div>
                    <h3 className="font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {pairingLinkDetected && (
            <p className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-100">
              Pairing link detected. Device ID and pairing code were prefilled from the URL.
            </p>
          )}

          <p className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-amber-100">
            Browsers cannot directly scan nearby Wi-Fi setup networks like a native mobile app. Connect to the FishFeeder setup Wi-Fi first, then use the setup portal or QR code to pair securely.
          </p>
        </div>

        <form onSubmit={submit} className="card h-fit space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">Secure claim</p>
              <h2 className="mt-2 text-2xl font-black">Enter pairing details</h2>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/20"><KeyRound /></span>
          </div>

          {success && <AlertMessage tone="success">{success}</AlertMessage>}
          {error && <AlertMessage tone="danger">{error}</AlertMessage>}

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
              className="field text-center text-2xl font-black tracking-[0.45em]"
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

          <button className="btn-primary w-full" disabled={loading || !readyToPair}>
            {loading ? 'Pairing...' : 'Pair this device'}
          </button>

          <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">
            <Copy className="mr-2 inline text-cyan-200" size={16} />
            The ESP setup portal can show a URL like `/devices/pair?deviceId=FF-A84F21&code=483921`. Open that URL while logged in to prefill this form.
          </div>
        </form>
      </div>
    </>
  );
}
