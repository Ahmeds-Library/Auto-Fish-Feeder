import { CalendarClock, CheckCircle2, Cloud, Fish, Power, Router, ShieldCheck, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardClock } from './DashboardClock';
import { MotionCard, StaggerGroup } from './motion';
import { IconBubble } from './ui';

const setupSteps = [
  { icon: Power, text: 'Power on device' },
  { icon: Wifi, text: 'Open FishFeeder-Setup Wi-Fi' },
  { icon: Router, text: 'Configure Wi-Fi and Firebase' },
  { icon: CheckCircle2, text: 'Claim with pairing code' },
];

const previews = [
  { icon: ShieldCheck, title: 'Device health preview', body: 'Online status, Wi-Fi signal, firmware sync, and last error will appear after pairing.' },
  { icon: Cloud, title: 'Cloud sync preview', body: 'Firebase state stays owner-scoped and each feeder uses its own device path.' },
  { icon: CalendarClock, title: 'Schedule preview', body: 'Automated feed schedules and command status appear once a device is linked.' },
];

export function EmptyFleetDashboard() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <MotionCard className="card motion-glow overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="mx-auto grid size-28 shrink-0 place-items-center rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 sm:mx-0">
            <Fish size={42} />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="badge-info mx-auto w-fit sm:mx-0">Empty fleet onboarding</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">No feeder paired yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mx-0 sm:text-base">
              Connect your first Fish Feeder to start monitoring schedules, feed commands, cloud sync, and device health from this dashboard.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {setupSteps.map((step, index) => (
                <div key={step.text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-left">
                  <IconBubble icon={step.icon} className="h-10 w-10 rounded-xl" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
                    <p className="text-sm font-semibold text-cyan-50">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="btn-primary mt-5 inline-flex min-h-11 w-full items-center justify-center sm:w-auto" to="/devices/pair">Pair your first feeder</Link>
          </div>
        </div>
      </MotionCard>

      <div className="grid gap-4">
        <MotionCard className="card p-5 sm:p-6">
          <p className="badge-info w-fit">Preview</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Fleet monitoring will appear here after pairing.</h3>
          <StaggerGroup className="mt-5 grid gap-3">
            {previews.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <IconBubble icon={item.icon} className="h-10 w-10 rounded-xl" />
                <div>
                  <p className="font-bold text-cyan-50">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.body}</p>
                </div>
              </div>
            ))}
          </StaggerGroup>
        </MotionCard>
        <DashboardClock />
      </div>
    </section>
  );
}
