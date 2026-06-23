export function DeveloperCredit({ variant = 'compact' }: { variant?: 'auth' | 'sidebar' | 'compact' | 'about' }) {
  if (variant === 'sidebar') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 text-xs text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-300/10">
        <p className="uppercase tracking-[0.24em]">Developed by</p>
        <p className="mt-1 font-semibold text-cyan-100">Mirza Ahmed Hassan</p>
      </div>
    );
  }

  if (variant === 'auth') {
    return (
      <p className="pt-1 text-center text-xs text-slate-500 transition hover:text-cyan-200">
        Crafted by <span className="font-semibold text-slate-300">Mirza Ahmed Hassan</span>
      </p>
    );
  }

  if (variant === 'about') {
    return (
      <div className="card max-w-2xl space-y-3">
        <p className="badge-info w-fit">About this project</p>
        <h2 className="section-title">Auto Fish Feeder</h2>
        <p className="text-sm leading-6 text-slate-300">A smart IoT dashboard for secure multi-device fish feeder control.</p>
        <p className="text-sm text-slate-400">Designed &amp; Developed by <span className="font-semibold text-cyan-100">Mirza Ahmed Hassan</span></p>
      </div>
    );
  }

  return (
    <p className="text-center text-xs text-slate-500 transition hover:text-cyan-200">
      Auto Fish Feeder · Developed by <span className="font-semibold text-slate-300">Mirza Ahmed Hassan</span>
    </p>
  );
}
