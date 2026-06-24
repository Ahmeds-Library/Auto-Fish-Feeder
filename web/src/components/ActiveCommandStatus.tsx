import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react';
import { timeAgo } from '../lib/format';
import { DeviceCommand } from '../types/schema';
import { AnimatedStatus } from './motion';
import { GlassCard } from './ui';

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
  if (status === 'running') return <Activity className="text-cyan-200" size={20} />;
  return <Info className="text-cyan-200" size={20} />;
}

export function ActiveCommandStatus({ command, className = '' }: { command?: DeviceCommand; className?: string }) {
  const status = command?.status ?? 'idle';
  const tone = commandTone(status);
  const payloadSource = typeof command?.payload?.source === 'string' ? command.payload.source : undefined;
  const message = command?.message || command?.error || (status === 'idle' ? 'No command is waiting for this device.' : 'Command sent. Waiting for device confirmation.');

  return (
    <GlassCard className={`space-y-4 ${status === 'running' ? 'border-cyan-300/30 motion-glow' : ''} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Active command status</p>
          <AnimatePresence mode="wait">
            <motion.h2 key={status} className="section-title mt-2 capitalize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {status}
            </motion.h2>
          </AnimatePresence>
        </div>
        <motion.div animate={status === 'running' ? { rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] } : { rotate: 0 }} transition={{ duration: 1.2, repeat: status === 'running' ? Infinity : 0 }}>
          <StatusIcon status={status} />
        </motion.div>
      </div>
      <AnimatedStatus tone={tone} label={status} pulse={status === 'pending' || status === 'running'} />
      <motion.p key={message} className="text-sm leading-6 text-slate-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>{message}</motion.p>
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
    <motion.div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3" whileHover={{ y: -2 }}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-cyan-50">{value}</p>
    </motion.div>
  );
}
