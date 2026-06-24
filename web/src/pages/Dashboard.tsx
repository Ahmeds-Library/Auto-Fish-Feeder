import { Activity, AlertTriangle, CalendarClock, Fish, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardClock } from '../components/DashboardClock';
import { MotionCard, StaggerGroup } from '../components/motion';
import { DeviceCard } from '../components/DeviceCard';
import { PageTitle } from '../components/Layout';
import { EmptyState, MetricCard, TimelineItem } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useUserDevices } from '../hooks/useUserDevices';
import { isOnline } from '../lib/format';

export function Dashboard() {
  const { user } = useAuth();
  const { devices, loading } = useUserDevices(user?.uid);
  const onlineCount = devices.filter((device) => isOnline(device.status?.lastSeen)).length;
  const todayFeeds = devices.reduce((sum, device) => sum + (device.status?.feeding?.todayCount ?? 0), 0);
  const alertCount = devices.filter((device) => Boolean(device.status?.lastError)).length;
  const recentLogs = devices
    .flatMap((device) => Object.values(device.logs ?? {}).map((log) => ({ ...log, deviceName: device.name })))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <>
      <PageTitle
        title="Aquarium command center"
        subtitle="A premium Firebase dashboard for securely operating many feeders from one hosted web app. Every action is scoped to the selected device."
      />

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        <MotionCard className="card relative overflow-hidden p-7 sm:p-8 motion-glow">
          <div className="absolute right-6 top-6 hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 p-6 text-cyan-100 sm:block">
            <Fish size={54} />
          </div>
          <p className="badge-info w-fit">Production IoT foundation</p>
          <h2 className="display-title mt-5 max-w-3xl">One cloud dashboard. <span className="text-gradient">Many aquariums.</span></h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Devices are loaded from your private `/users/{'{uid}'}/devices` map and controlled through `/devices/{'{deviceId}'}` paths only.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/devices/pair">Pair a feeder</Link>
            <Link className="btn-ghost" to="/devices">View fleet</Link>
          </div>
        </MotionCard>

        <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard icon={Fish} label="Linked feeders" value={devices.length} helper="Visible to this account" delay={0} />
          <MetricCard icon={Activity} label="Online now" value={onlineCount} helper="Based on last heartbeat" delay={80} />
          <MetricCard icon={CalendarClock} label="Feeds today" value={todayFeeds} helper="Across linked devices" delay={160} />
          <MetricCard icon={AlertTriangle} label="Alerts" value={alertCount} helper="Devices reporting lastError" delay={240} />
        </StaggerGroup>
      </section>

      <StaggerGroup className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_.95fr]">
        <div className="card">
          <ShieldCheck className="text-emerald-200" />
          <h3 className="mt-3 text-lg font-bold">Owner scoped</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Only devices linked under your Firebase user node are displayed.</p>
        </div>
        <div className="card">
          <Activity className="text-cyan-200" />
          <h3 className="mt-3 text-lg font-bold">Live commands</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Feed, test motor, sync, and emergency stop commands write to one selected feeder.</p>
        </div>
        <div className="card">
          <CalendarClock className="text-blue-200" />
          <h3 className="mt-3 text-lg font-bold">Per-device schedules</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Schedules live at `/devices/{'{deviceId}'}/schedules` for safe scaling.</p>
        </div>
        <DashboardClock />
      </StaggerGroup>



      <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_.85fr]">
        <div className="card">
          <p className="badge-info w-fit">Account security</p>
          <h2 className="section-title mt-3">Only devices linked to your account are visible here.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">The dashboard reads your private user-device map and never broadcasts commands globally. Each feed action stays scoped to one feeder.</p>
        </div>
        <div className="card">
          <p className="badge-info w-fit">Recent activity</p>
          <div className="mt-4 space-y-3">
            {recentLogs.length ? recentLogs.map((log, index) => (
              <TimelineItem key={`${log.createdAt}-${index}`} title={log.level} tone={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : log.level === 'success' ? 'success' : 'info'} meta={`${log.deviceName} • ${new Date(log.createdAt).toLocaleString()}`} delay={index * 80}>
                {log.message}
              </TimelineItem>
            )) : <p className="text-sm text-slate-400">No recent device logs yet.</p>}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card animate-pulse text-cyan-100">Loading your aquarium fleet...</div>
      ) : devices.length ? (
        <StaggerGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={Fish}
          title="No feeders linked yet"
          body="Power on a FishFeeder, use its setup portal to get a pairing code, then securely claim it from this dashboard."
          action={<Link className="btn-primary inline-block" to="/devices/pair">Start pairing</Link>}
        />
      )}
    </>
  );
}
