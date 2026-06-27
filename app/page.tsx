'use client';

import React from 'react';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  Trophy,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  MapPinIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { NoticeBoard, HelplineDirectory } from '@/components/government';

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function Home() {
  const { user } = useAuth();
  const { issues, loading } = useIssues({ pageLimit: 6 });
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-12 py-6">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between gap-8 py-8 md:py-16 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/10 border border-violet-600/20 text-violet-700 text-xs font-semibold w-fit">
            <Zap className="w-3.5 h-3.5 fill-violet-600 text-violet-600" />
            {t('tagline')}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none text-zinc-900">
            {t('heroTitlePre')} <br />
            <span className="gradient-text">{t('heroTitlePost')}</span>
          </h1>

          <p className="text-zinc-600 text-lg max-w-xl">
            {t('heroDesc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href="/report"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Camera className="w-5 h-5" />
              {t('reportNow')}
            </Link>
            <Link
              href="/track"
              className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-bold px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <MapPin className="w-5 h-5 text-sky-600" />
              {t('trackTickets')}
            </Link>
          </div>
        </div>

        {/* Feature highlights card */}
        <div className="flex-1 relative w-full max-w-lg mt-8 md:mt-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 to-sky-600/10 blur-3xl -z-10" />
          <div className="glass-card p-6 w-full flex flex-col gap-4 glow-purple border-white/15">
            <div className="flex items-center justify-between border-b border-zinc-200/50 pb-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold tracking-wide uppercase text-emerald-600">{t('live')}</span>
              </div>
              <span className="text-xs text-gray-500">
                {loading ? 'Loading...' : `${issues.length} ${issues.length === 1 ? t('activeIncident') : t('activeIncidents')}`}
              </span>
            </div>

            <div className="rounded-xl bg-violet-600/5 border border-violet-600/20 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700 font-mono">{t('aiVision')}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {t('aiDesc')}
              </p>
              <div className="flex items-center justify-between text-[10px] text-violet-600 font-mono mt-1 pt-1.5 border-t border-violet-500/10">
                <span>{t('aiModel')}</span>
                <span>{t('aiEmbeddings')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-800">{t('feature1Title')}</h3>
            <p className="text-sm text-zinc-500 mt-1">{t('feature1Desc')}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
            <MapPinIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-800">{t('feature2Title')}</h3>
            <p className="text-sm text-zinc-500 mt-1">{t('feature2Desc')}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-800">{t('feature3Title')}</h3>
            <p className="text-sm text-zinc-500 mt-1">{t('feature3Desc')}</p>
          </div>
        </div>
      </section>

      {/* Government Mandatory Notice Board & Helpline Directory */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NoticeBoard />
        <HelplineDirectory />
      </section>

      {/* Live Issues Feed */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900">{t('liveTickets')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t('liveTicketsSub')}</p>
          </div>
          <Link href="/track" className="text-sm font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1">
            {t('viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <span className="text-sm">Loading live issues...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center gap-4 text-center border-white/5">
            <Camera className="w-10 h-10 text-violet-600/40" />
            <p className="font-bold text-zinc-800">{t('noIssues')}</p>
            <p className="text-sm text-gray-400">{t('noIssuesDesc')}</p>
            <Link
              href="/report"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Camera className="w-4 h-4" /> {t('reportNowBtn')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {issues.slice(0, 6).map((report) => (
              <Link
                key={report.id}
                href={`/issues/${report.id}`}
                className="glass-card p-5 flex flex-col gap-4 border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                    SEVERITY_STYLE[report.severity] || SEVERITY_STYLE.low
                  )}>
                    {report.severity}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                    report.status === 'resolved'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  )}>
                    {report.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 line-clamp-1 group-hover:text-violet-600 transition-colors">{report.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{report.location?.address || 'Unknown location'}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200/50 mt-auto">
                  <span className="text-xs text-zinc-400">{report.category}</span>
                  <span className="text-xs font-bold text-violet-600">▲ {report.upvotes ?? 0} upvotes</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
