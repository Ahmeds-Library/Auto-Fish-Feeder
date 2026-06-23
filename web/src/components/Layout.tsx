import {
  Activity,
  CalendarClock,
  Fish,
  Gauge,
  Home,
  Link as LinkIcon,
  ListChecks,
  LogOut,
  PlusCircle,
  Settings,
  User,
  Waves,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageTransition } from './ui';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/devices', label: 'Devices', icon: Fish },
  { to: '/devices/pair', label: 'Pair Device', icon: PlusCircle },
  { to: '/account', label: 'Account', icon: User },
];

const deviceNav = [
  { path: 'overview', label: 'Overview', icon: Gauge },
  { path: 'feed', label: 'Feed', icon: Activity },
  { path: 'schedules', label: 'Schedules', icon: CalendarClock },
  { path: 'motor-settings', label: 'Motor', icon: Settings },
  { path: 'logs', label: 'Logs', icon: ListChecks },
  { path: 'settings', label: 'Settings', icon: Settings },
];

export function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-slate-950/60 p-5 backdrop-blur-2xl lg:block">
        <div className="mb-8 flex items-center gap-3">
          <span className="rounded-2xl bg-cyan-300 p-2.5 text-slate-950 shadow-glow">
            <Fish size={24} />
          </span>
          <div>
            <p className="text-lg font-black leading-tight">AquaFeed Cloud</p>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">IoT Fleet</p>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Waves size={18} /> Secure device cloud
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">Per-device commands, Firebase Auth, and live RTDB sync.</p>
        </div>

        <nav className="space-y-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `navlink ${isActive ? 'navlink-active' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <button onClick={logout} className="btn-ghost absolute bottom-5 left-5 right-5 flex items-center justify-center gap-2">
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="relative z-10 pb-28 lg:ml-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-4 py-3 backdrop-blur-2xl lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black">
              <span className="rounded-xl bg-cyan-300 p-2 text-slate-950"><Fish size={18} /></span>
              AquaFeed
            </div>
            <span className="badge-info">Live</span>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-8">
          <PageTransition><Outlet /></PageTransition>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-white/10 bg-slate-950/85 p-2 backdrop-blur-2xl lg:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `navlink justify-center px-2 ${isActive ? 'navlink-active' : ''}`}>
            <span className="flex flex-col items-center gap-1 text-[11px]"><Icon size={18} />{label.replace(' Device', '')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export const DeviceNav = ({ id }: { id: string }) => (
  <div className="mb-6 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
    {deviceNav.map(({ path, label, icon: Icon }) => (
      <NavLink
        className={({ isActive }) => `navlink whitespace-nowrap ${isActive ? 'navlink-active' : ''}`}
        key={path}
        to={`/devices/${id}/${path}`}
      >
        <Icon size={17} /> {label}
      </NavLink>
    ))}
  </div>
);

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">FishFeeder</p>
          <h1 className="page-heading mt-3 max-w-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
          <LinkIcon size={16} /> Scoped RTDB paths
        </div>
      </div>
    </div>
  );
}
