import { Activity, AlertTriangle, CalendarClock, Fish, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardClock } from '../components/DashboardClock';
import { DeviceCard } from '../components/DeviceCard';
import { FleetHealth } from '../components/FleetHealth';
import { MotionCard, StaggerGroup } from '../components/motion';
import { AlertMessage, EmptyState, IconBubble, MetricCard, SkeletonCard, TimelineItem } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useUserDevices } from '../hooks/useUserDevices';
import { isOnline } from '../lib/format';

export function Dashboard() {
  const { user } = useAuth();
  const { devices, loading, error } = useUserDevices(user?.uid);
  const onlineCount = devices.filter((device) => isOnline(device.status?.lastSeen)).length;
  const todayFeeds = devices.reduce((sum, device) => sum + (device.status?.feeding?.todayCount ?? 0), 0);
  const alertCount = devices.filter((device) => Boolean(device.status?.lastError)).length;
  const recentLogs = devices
    .flatMap((device) => Object.values(device.logs ?? {}).map((log) => ({ ...log, deviceName: device.name })))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
  const hasDevices = devices.length > 0;

  return (
    <>
      <MotionCard className="card motion-glow mb-5 overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="badge-info w-fit">AquaFeed command center</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(1.85rem,4vw,3.35rem)] font-black leading-[1.05] tracking-[-0.045em] text-white">
              Smart feeding, <span className="text-gradient">owner scoped.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage linked feeders, live commands, schedules, and device health without using global Firebase command paths.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Link className="btn-primary inline-flex min-h-11 items-center justify-center" to="/devices/pair">Pair device</Link>
            <Link className="btn-ghost inline-flex min-h-11 items-center justify-center" to="/devices">View fleet</Link>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">Scoped RTDB paths</span>
          <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1">/users/{'{uid}'}/devices</span>
          <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1">/devices/{'{deviceId}'}</span>
        </div>
      </MotionCard>

      {error && (
        <div className="mb-5">
          <AlertMessage tone="danger"><b>Could not load your device fleet.</b> {error}</AlertMessage>
        </div>
      )}

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.45fr_.9fr]">
        <FleetHealth total={devices.length} online={onlineCount} alerts={alertCount} feedsToday={todayFeeds} />
        <DashboardClock />
      </section>

      {loading ? (
        <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </section>
      ) : hasDevices ? (
        <StaggerGroup className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Fish} label="Linked feeders" value={devices.length} helper="Visible to this account" delay={0} />
          <MetricCard icon={Activity} label="Online now" value={onlineCount} helper="Based on last heartbeat" delay={80} />
          <MetricCard icon={CalendarClock} label="Feeds today" value={todayFeeds} helper="Across linked devices" delay={160} />
          <MetricCard icon={AlertTriangle} label="Alerts" value={alertCount} helper="Devices reporting lastError" delay={240} />
        </StaggerGroup>
      ) : (
        <MotionCard className="card mb-5 overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <IconBubble icon={Fish} />
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Your first feeder is not paired yet.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Power on the device, open the setup portal, then claim it securely with a pairing code. Once linked, command and health cards appear here.
                </p>
              </div>
            </div>
            <Link className="btn-primary inline-flex min-h-11 shrink-0 items-center justify-center" to="/devices/pair">Pair your first feeder</Link>
          </div>
        </MotionCard>
      )}

      <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_.85fr]">
        <MotionCard className="card">
          <div className="flex items-start gap-3">
            <IconBubble icon={ShieldCheck} tone="success" />
            <div>
              <h2 className="section-title">Only devices linked to your account are visible here.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">The dashboard reads your private user-device map and never broadcasts commands globally. Each feed action stays scoped to one feeder.</p>
            </div>
          </div>
        </MotionCard>
        <MotionCard className="card">
          <p className="badge-info w-fit">Recent activity</p>
          <div className="mt-4 space-y-3">
            {recentLogs.length ? recentLogs.map((log, index) => (
              <TimelineItem key={`${log.createdAt}-${index}`} title={log.level} tone={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : log.level === 'success' ? 'success' : 'info'} meta={`${log.deviceName} • ${new Date(log.createdAt).toLocaleString()}`} delay={index * 80}>
                {log.message}
              </TimelineItem>
            )) : <p className="text-sm text-slate-400">No recent device logs yet.</p>}
          </div>
        </MotionCard>
      </section>

      {loading ? null : hasDevices ? (
        <StaggerGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
        </StaggerGroup>
      ) : !error && (
        <EmptyState
          icon={Fish}
          title="No feeders linked yet"
          body="Use the guided pairing flow after configuring your ESP8266 through the local setup portal. The empty fleet state stays calm until your first device is claimed."
          action={<Link className="btn-primary inline-block" to="/devices/pair">Start pairing</Link>}
        />
      )}
    </>
  );
}
