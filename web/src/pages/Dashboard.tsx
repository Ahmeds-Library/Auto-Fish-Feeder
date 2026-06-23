import { Activity, CalendarClock, Fish, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeviceCard } from '../components/DeviceCard';
import { PageTitle } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useUserDevices } from '../hooks/useUserDevices';
import { isOnline } from '../lib/format';

export function Dashboard() {
  const { user } = useAuth();
  const { devices, loading } = useUserDevices(user?.uid);
  const onlineCount = devices.filter((device) => isOnline(device.status?.lastSeen)).length;
  const todayFeeds = devices.reduce((sum, device) => sum + (device.status?.feeding?.todayCount ?? 0), 0);

  return (
    <>
      <PageTitle
        title="Aquarium command center"
        subtitle="A premium Firebase dashboard for securely operating many feeders from one hosted web app. Every action is scoped to the selected device."
      />

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        <div className="card relative overflow-hidden p-7 sm:p-8">
          <div className="absolute right-6 top-6 hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 p-6 text-cyan-100 sm:block">
            <Fish size={54} />
          </div>
          <p className="badge-info w-fit">Production IoT foundation</p>
          <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">One cloud dashboard. Many aquariums. Zero global feed commands.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Devices are loaded from your private `/users/{'{uid}'}/devices` map and controlled through `/devices/{'{deviceId}'}` paths only.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/devices/pair">Pair a feeder</Link>
            <Link className="btn-ghost" to="/devices">View fleet</Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Metric icon={Fish} label="Linked feeders" value={devices.length} helper="Visible to this account" />
          <Metric icon={Activity} label="Online now" value={onlineCount} helper="Based on last heartbeat" />
          <Metric icon={CalendarClock} label="Feeds today" value={todayFeeds} helper="Across linked devices" />
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card">
          <ShieldCheck className="text-emerald-200" />
          <h3 className="mt-3 text-lg font-bold">Owner scoped</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Only devices linked under your Firebase user node are displayed.</p>
        </div>
        <div className="card">
          <Activity className="text-cyan-200" />
          <h3 className="mt-3 text-lg font-bold">Live commands</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Feed actions write to one active command path for one selected feeder.</p>
        </div>
        <div className="card">
          <CalendarClock className="text-blue-200" />
          <h3 className="mt-3 text-lg font-bold">Per-device schedules</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Schedules live at `/devices/{'{deviceId}'}/schedules` for safe scaling.</p>
        </div>
      </section>

      {loading ? (
        <div className="card animate-pulse text-cyan-100">Loading your aquarium fleet...</div>
      ) : devices.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
        </div>
      ) : (
        <div className="card text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-cyan-300/15 text-cyan-100">
            <Fish size={32} />
          </div>
          <h2 className="mt-4 text-2xl font-black">No feeders linked yet</h2>
          <p className="mx-auto my-3 max-w-xl text-slate-300">Power on a FishFeeder, use its setup portal to get a pairing code, then securely claim it from this dashboard.</p>
          <Link className="btn-primary inline-block" to="/devices/pair">Start pairing</Link>
        </div>
      )}
    </>
  );
}

function Metric({ icon: Icon, label, value, helper }: { icon: typeof Fish; label: string; value: number; helper: string }) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="text-cyan-200" size={20} />
      </div>
      <b className="mt-3 block text-4xl font-black text-white">{value}</b>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}
