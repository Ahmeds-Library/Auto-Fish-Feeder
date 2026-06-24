import { Activity, AlertTriangle, CalendarClock, Fish, RotateCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardClock } from '../components/DashboardClock';
import { DeviceCard } from '../components/DeviceCard';
import { EmptyFleetDashboard } from '../components/EmptyFleetDashboard';
import { FleetHealth } from '../components/FleetHealth';
import { MotionCard, StaggerGroup } from '../components/motion';
import { AlertMessage, IconBubble, MetricCard, SkeletonCard, TimelineItem } from '../components/ui';
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
    .slice(0, 4);
  const hasDevices = devices.length > 0;

  return (
    <>
      <CommandHeader />

      {loading ? <DashboardLoading /> : error ? <DashboardError detail={error} /> : !hasDevices ? (
        <EmptyFleetDashboard />
      ) : (
        <>
          <KpiStrip total={devices.length} online={onlineCount} feedsToday={todayFeeds} alerts={alertCount} />

          <section className="mb-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <FleetHealth total={devices.length} online={onlineCount} alerts={alertCount} feedsToday={todayFeeds} />
            <div className="grid gap-4">
              <DashboardClock />
              <OwnerScopedCard />
            </div>
          </section>

          <section className="mb-5 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
            <RecentActivity logs={recentLogs} />
            <StaggerGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
            </StaggerGroup>
          </section>
        </>
      )}
    </>
  );
}

function CommandHeader() {
  return (
    <MotionCard className="card mb-5 overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="badge-info w-fit">Dashboard</p>
            <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-xs font-semibold text-slate-300">Owner-scoped RTDB paths</span>
          </div>
          <h1 className="mt-3 text-[clamp(1.65rem,3.5vw,3rem)] font-black leading-[1.08] tracking-[-0.045em] text-white">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Manage your linked fish feeders, schedules, commands, and device health from a compact control center.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:shrink-0">
          <Link className="btn-primary inline-flex min-h-11 items-center justify-center" to="/devices/pair">Pair Device</Link>
          <Link className="btn-ghost inline-flex min-h-11 items-center justify-center" to="/devices">View Devices</Link>
        </div>
      </div>
    </MotionCard>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <SkeletonCard className="min-h-64" />
        <SkeletonCard className="min-h-64" />
      </section>
    </div>
  );
}

function DashboardError({ detail }: { detail: string }) {
  return (
    <MotionCard className="card motion-glow p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <IconBubble icon={AlertTriangle} tone="danger" />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Could not load your device fleet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Check Firebase rules, network, or login state. {detail}</p>
          </div>
        </div>
        <button className="btn-ghost inline-flex min-h-11 items-center justify-center gap-2" type="button" onClick={() => window.location.reload()}>
          <RotateCw size={16} /> Retry
        </button>
      </div>
    </MotionCard>
  );
}

function KpiStrip({ total, online, feedsToday, alerts }: { total: number; online: number; feedsToday: number; alerts: number }) {
  return (
    <StaggerGroup className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={Fish} label="Linked feeders" value={total} helper="Visible to this account" delay={0} />
      <MetricCard icon={Activity} label="Online now" value={online} helper="Based on last heartbeat" delay={80} />
      <MetricCard icon={CalendarClock} label="Feeds today" value={feedsToday} helper="Across linked devices" delay={160} />
      <MetricCard icon={AlertTriangle} label="Alerts" value={alerts} helper="Devices reporting lastError" delay={240} />
    </StaggerGroup>
  );
}

function OwnerScopedCard() {
  return (
    <MotionCard className="card p-5">
      <div className="flex gap-3">
        <IconBubble icon={ShieldCheck} tone="success" />
        <div>
          <h2 className="text-lg font-black text-white">Owner-scoped controls</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">The dashboard reads your private user-device map and writes commands only to the selected feeder.</p>
        </div>
      </div>
    </MotionCard>
  );
}

function RecentActivity({ logs }: { logs: Array<{ level: string; message: string; createdAt: number; deviceName: string }> }) {
  return (
    <MotionCard className="card h-fit p-5">
      <p className="badge-info w-fit">Recent activity</p>
      <div className="mt-4 space-y-3">
        {logs.length ? logs.map((log, index) => (
          <TimelineItem key={`${log.createdAt}-${index}`} title={log.level} tone={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : log.level === 'success' ? 'success' : 'info'} meta={`${log.deviceName} • ${new Date(log.createdAt).toLocaleString()}`} delay={index * 80}>
            {log.message}
          </TimelineItem>
        )) : <p className="text-sm text-slate-400">No recent device logs yet.</p>}
      </div>
    </MotionCard>
  );
}
