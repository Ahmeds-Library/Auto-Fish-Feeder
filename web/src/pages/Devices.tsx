import { Activity, AlertTriangle, Fish, PlusCircle, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeviceCard } from '../components/DeviceCard';
import { PageTitle } from '../components/Layout';
import { StaggerGroup } from '../components/motion';
import { EmptyState, SkeletonCard } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useUserDevices } from '../hooks/useUserDevices';
import { isOnline } from '../lib/format';

export function DevicesPage() {
  const { user } = useAuth();
  const { devices, loading } = useUserDevices(user?.uid);
  const online = devices.filter((device) => isOnline(device.status?.lastSeen)).length;
  const alerts = devices.filter((device) => Boolean(device.status?.lastError)).length;

  return (
    <>
      <PageTitle title="Your feeders" subtitle="Only devices linked under your private `/users/{uid}/devices` node are shown here." />
      <div className="mb-6 overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.35)] backdrop-blur-2xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="badge-info w-fit">Fleet inventory</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Device health and inventory</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Review linked feeders, connection quality, motor state, and recent feed activity before opening a device control panel.
            </p>
          </div>
          <Link className="btn-primary inline-flex min-h-11 items-center justify-center gap-2" to="/devices/pair"><PlusCircle size={18} /> Pair new device</Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InventoryStat icon={Fish} label="Linked" value={devices.length} helper="Owner-scoped feeders" />
          <InventoryStat icon={Radio} label="Online" value={online} helper={`${Math.max(devices.length - online, 0)} offline`} />
          <InventoryStat icon={AlertTriangle} label="Alerts" value={alerts} helper={alerts ? 'Needs attention' : 'No reported errors'} tone={alerts ? 'danger' : 'success'} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : devices.length ? (
        <StaggerGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={Fish}
          title="Your fleet is empty"
          body="Use the guided pairing flow after configuring your ESP8266 through the local setup portal. The dashboard will only show feeders claimed by your account."
          action={<Link className="btn-primary mt-5 inline-block" to="/devices/pair">Pair your first feeder</Link>}
        />
      )}
    </>
  );
}

function InventoryStat({ icon: Icon, label, value, helper, tone = 'info' }: { icon: typeof Activity; label: string; value: number; helper: string; tone?: 'info' | 'success' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-rose-200 bg-rose-300/10 border-rose-300/20' : tone === 'success' ? 'text-emerald-200 bg-emerald-300/10 border-emerald-300/20' : 'text-cyan-200 bg-cyan-300/10 border-cyan-300/20';
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <span className={`rounded-2xl border p-2 ${toneClass}`}><Icon size={16} /></span>
      </div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}
