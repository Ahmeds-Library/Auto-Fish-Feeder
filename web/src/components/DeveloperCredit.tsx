import { BriefcaseBusiness, Code2, Globe, Mail, Network } from 'lucide-react';
import { developerProfile, externalUrl } from '../config/developer';

const contactLinks = [
  { key: 'github', label: 'GitHub', icon: Code2, href: developerProfile.github },
  { key: 'portfolio', label: 'Portfolio', icon: Globe, href: developerProfile.portfolio },
  { key: 'linkedin', label: 'LinkedIn', icon: Network, href: developerProfile.linkedin },
  { key: 'upwork', label: 'Upwork', icon: BriefcaseBusiness, href: developerProfile.upwork },
  { key: 'email', label: 'Email', icon: Mail, href: developerProfile.email ? `mailto:${developerProfile.email}` : '' },
].filter((link) => Boolean(link.href));

function ContactLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'mt-2 flex justify-center gap-2' : 'mt-3 flex flex-wrap gap-2'}>
      {contactLinks.map(({ key, label, icon: Icon, href }) => (
        <a
          aria-label={`Contact ${developerProfile.name} on ${label}`}
          className={compact ? 'rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100' : 'btn-ghost inline-flex items-center gap-2 px-3 py-2 text-xs'}
          href={key === 'email' ? href : externalUrl(href)}
          key={key}
          rel={key === 'email' ? undefined : 'noreferrer'}
          target={key === 'email' ? undefined : '_blank'}
          title={label}
        >
          <Icon size={compact ? 14 : 15} />
          {!compact && <span>{label}</span>}
        </a>
      ))}
    </div>
  );
}

export function DeveloperCredit({ variant = 'compact' }: { variant?: 'auth' | 'sidebar' | 'compact' | 'about' }) {
  if (variant === 'sidebar') {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 text-xs text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-300/10">
        <p className="uppercase tracking-[0.24em]">Developed by</p>
        <p className="mt-1 font-semibold text-cyan-100">{developerProfile.name}</p>
        <ContactLinks compact />
      </div>
    );
  }

  if (variant === 'auth') {
    return (
      <div className="pt-1 text-center text-xs text-slate-500">
        <p className="transition hover:text-cyan-200">Crafted by <span className="font-semibold text-slate-300">{developerProfile.name}</span></p>
        <ContactLinks compact />
      </div>
    );
  }

  if (variant === 'about') {
    return (
      <div className="card max-w-2xl space-y-3">
        <p className="badge-info w-fit">About this project</p>
        <h2 className="section-title">Auto Fish Feeder</h2>
        <p className="text-sm leading-6 text-slate-300">A smart IoT dashboard for secure multi-device fish feeder control.</p>
        <div>
          <p className="text-sm text-slate-400">Designed &amp; Developed by <span className="font-semibold text-cyan-100">{developerProfile.name}</span></p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{developerProfile.role}</p>
        </div>
        <ContactLinks />
      </div>
    );
  }

  return (
    <div className="text-center text-xs text-slate-500">
      <p className="transition hover:text-cyan-200">Auto Fish Feeder · Developed by <span className="font-semibold text-slate-300">{developerProfile.name}</span></p>
    </div>
  );
}
