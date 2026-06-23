import { Fish, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeviceCard } from '../components/DeviceCard';
import { PageTitle } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useUserDevices } from '../hooks/useUserDevices';

export function DevicesPage() {
  const { user } = useAuth();
  const { devices, loading } = useUserDevices(user?.uid);

  return (
    <>
      <PageTitle title="Your feeders" subtitle="Only devices linked under your private `/users/{uid}/devices` node are shown here." />
      <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-cyan-100">Fleet inventory</p>
          <p className="text-sm text-slate-400">{devices.length} linked feeder{devices.length === 1 ? '' : 's'} in this account</p>
        </div>
        <Link className="btn-primary inline-flex items-center justify-center gap-2" to="/devices/pair"><PlusCircle size={18} /> Pair new device</Link>
      </div>

      {loading ? (
        <div className="card animate-pulse">Loading devices...</div>
      ) : devices.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
        </div>
      ) : (
        <div className="card text-center">
          <Fish className="mx-auto text-cyan-200" size={52} />
          <h2 className="mt-4 text-2xl font-black">Your fleet is empty</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">Use the guided pairing flow after configuring your ESP8266 through the local setup portal.</p>
          <Link className="btn-primary mt-5 inline-block" to="/devices/pair">Pair your first feeder</Link>
        </div>
      )}
    </>
  );
}
