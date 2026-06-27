'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  AlertTriangle, 
  X, 
  Megaphone, 
  FileText, 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldAlert,
  Flame,
  Droplet,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// 1. EMERGENCY ANNOUNCEMENTS BANNER
// ==========================================
export function EmergencyBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-red-600 text-white py-3 px-4 shadow-md flex items-center justify-between gap-3 text-xs md:text-sm font-medium z-40 relative md:rounded-lg md:mb-6 animate-fade-in">
      <div className="flex items-center gap-2 flex-1">
        <AlertTriangle className="w-5 h-5 animate-pulse shrink-0" />
        <span className="font-bold tracking-wider bg-red-800 px-2 py-0.5 rounded text-[10px] shrink-0">
          {t('emergencyActive')}
        </span>
        <p className="line-clamp-2 md:line-clamp-1">
          {t('emergencyAlertStorm')}
        </p>
      </div>
      <button 
        onClick={() => setDismissed(true)} 
        className="p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss Alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ==========================================
// 2. NOTICE BOARD COMPONENT
// ==========================================
export function NoticeBoard() {
  const { t } = useLanguage();

  const notices = [
    { title: t('notice1Title'), date: t('notice1Date'), desc: t('notice1Desc') },
    { title: t('notice2Title'), date: t('notice2Date'), desc: t('notice2Desc') },
    { title: t('notice3Title'), date: t('notice3Date'), desc: t('notice3Desc') },
  ];

  return (
    <section className="glass-card p-6 flex flex-col gap-6 text-left w-full">
      <div className="flex items-center gap-3 border-b border-zinc-200/60 pb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{t('noticeTitle')}</h2>
          <p className="text-xs text-zinc-500">{t('noticeSub')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {notices.map((notice, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-lg bg-zinc-50 hover:bg-blue-50/20 border border-zinc-200/50 hover:border-blue-200/50 transition-all duration-200 group flex items-start gap-3.5 text-left"
          >
            <div className="w-8 h-8 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0 shadow-sm">
              <FileText className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-bold text-sm text-zinc-800 group-hover:text-blue-700 transition-colors truncate">
                  {notice.title}
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                  {notice.date}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                {notice.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 3. EMERGENCY HELPLINE DIRECTORY
// ==========================================
export function HelplineDirectory() {
  const { t } = useLanguage();

  const helplines = [
    { name: t('helpDisaster'), number: '108', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { name: t('helpAmbulance'), number: '102', icon: PhoneCall, color: 'text-red-500', bg: 'bg-red-50/50', border: 'border-red-100/60' },
    { name: t('helpFire'), number: '101', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { name: t('helpPolice'), number: '100', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: t('helpWater'), number: '1916', icon: Droplet, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    { name: t('helpPower'), number: '1912', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  ];

  return (
    <section className="glass-card p-6 flex flex-col gap-6 text-left w-full">
      <div className="flex items-center gap-3 border-b border-zinc-200/60 pb-4">
        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{t('helplineTitle')}</h2>
          <p className="text-xs text-zinc-500">{t('helplineSub')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {helplines.map((item, idx) => {
          const Icon = item.icon;
          return (
            <a 
              key={idx} 
              href={`tel:${item.number}`}
              className={cn(
                "p-4 rounded-xl border flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm",
                item.bg, item.border
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                <Icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-700 truncate">{item.name}</p>
                <p className={cn("text-base font-extrabold font-mono mt-0.5", item.color)}>
                  {item.number}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// 4. FOOTER WITH GOVERNMENT CONTACTS
// ==========================================
export function GovernmentFooter() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-zinc-900 text-zinc-400 mt-20 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
        {/* About Government Agency */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-extrabold text-base tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            {t('footerGovTitle')}
          </h3>
          <p className="text-xs leading-relaxed text-zinc-400 max-w-sm">
            {t('footerGovSub')} Dedicated to transparent civic governance and citizen empowerment.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">{t('footerQuickLinks')}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a href="/" className="hover:text-white transition-colors">{t('home')}</a>
            <a href="/report" className="hover:text-white transition-colors">{t('report')}</a>
            <a href="/map" className="hover:text-white transition-colors">{t('map')}</a>
            <a href="/leaderboard" className="hover:text-white transition-colors">{t('leaderboard')}</a>
          </div>
        </div>

        {/* Contact Info Desk */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">{t('footerHelpline')}</h4>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-start gap-2">
              <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="font-extrabold text-zinc-200">{t('footerHelplineNo')}</p>
                <p className="text-[10px] text-zinc-500">Toll-Free 24x7</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="hover:text-white transition-colors">{t('footerEmail')}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="leading-snug">{t('footerAddress')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="w-full bg-zinc-950 py-5 px-6 border-t border-zinc-900 text-center text-[10px] text-zinc-500">
        {t('copyright')}
      </div>
    </footer>
  );
}
