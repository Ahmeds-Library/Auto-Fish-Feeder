import { Activity, AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react';
import { timeAgo } from '../lib/format';
import { DeviceCommand } from '../types/schema';
import { GlassCard, StatusBadge } from './ui';

function commandTone(status?: string): 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'pending') return 'warning';
  return 'info';
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'completed') return <CheckCircle2 className="text-emerald-200" size={20} />;
  if (status === 'failed') return <AlertTriangle className="text-rose-200" size={20} />;
  if (status === 'pending') return <Clock3 className="text-amber-200" size={20} />;
  if (status === 'running') return <Activity className="animate-pulse text-cyan-200" size={20} />;
  return <Info className="text-cyan-200" size={20} />;
}

export function ActiveCommandStatus({ command, className = '' }: { command?: DeviceCommand; className?: string }) {
  const status = command?.status ?? 'idle';
  const tone = commandTone(status);
  const payloadSource = typeof command?.payload?.source === 'string' ? command.payload.source : undefined;
  const message = command?.message || command?.error || (status === 'idle' ? 'No command is waiting for this device.' : 'Command sent. Waiting for device confirmation.');

  return (
    <GlassCard className={`space-y-4 ${status === 'running' ? 'border-cyan-300/30 shadow-glow' : ''} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Active command status</p>
          <h2 className="section-title mt-2 capitalize">{status}</h2>
        </div>
        <StatusIcon status={status} />
      </div>
      <StatusBadge tone={tone}>{status}</StatusBadge>
      <p className="text-sm leading-6 text-slate-300">{message}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoPill label="Type" value={command?.type ?? 'none'} />
        <InfoPill label="Source" value={payloadSource ?? 'device'} />
        <InfoPill label="Created" value={command?.createdAt ? timeAgo(command.createdAt) : '—'} />
        <InfoPill label="Updated" value={command?.updatedAt ? timeAgo(command.updatedAt) : '—'} />
      </div>
    </GlassCard>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-cyan-50">{value}</p>
    </div>
  );
}
