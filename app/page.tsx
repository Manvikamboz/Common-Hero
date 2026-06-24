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

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function Home() {
  const { user } = useAuth();
  const { issues, loading } = useIssues({ pageLimit: 6 });

  return (
    <div className="flex flex-col gap-12 py-6">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between gap-8 py-8 md:py-16 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold w-fit animate-pulse">
            <Zap className="w-3.5 h-3.5 fill-violet-400" />
            Empowering Hyperlocal Civic Actions
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
            Report Civic Issues. <br />
            <span className="gradient-text">Empower Your Ward.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl">
            Community Hero connects citizens, validators, and municipal teams in real time. Powered by Gemini AI for automated categorizing and priority mapping.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href="/report"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Camera className="w-5 h-5" />
              Report Issue Now
            </Link>
            <Link
              href="/track"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <MapPin className="w-5 h-5 text-sky-400" />
              Track Open Tickets
            </Link>
          </div>
        </div>

        {/* Feature highlights card */}
        <div className="flex-1 relative w-full max-w-lg mt-8 md:mt-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-sky-600/20 blur-3xl -z-10" />
          <div className="glass-card p-6 w-full flex flex-col gap-4 glow-purple border-white/15">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold tracking-wide uppercase text-emerald-400">Live</span>
              </div>
              <span className="text-xs text-gray-500">
                {loading ? 'Loading...' : `${issues.length} active incident${issues.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300 font-mono">Gemini AI Vision</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                Auto-categorizes photos → assigns severity → runs duplicate check in 500m radius → routes to municipal authority.
              </p>
              <div className="flex items-center justify-between text-[10px] text-violet-400 font-mono mt-1 pt-1.5 border-t border-violet-500/10">
                <span>Model: gemini-2.5-pro</span>
                <span>Embeddings: gemini-embedding-001</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Gamified Action</h3>
            <p className="text-sm text-gray-400 mt-1">Earn 10 points per report and 15 points per verification. Unlock exclusive badges.</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <MapPinIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Hyperlocal Auto-Routing</h3>
            <p className="text-sm text-gray-400 mt-1">Issues are automatically routed using GeoJSON boundaries directly to assigned authorities.</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Zero-Spam Verification</h3>
            <p className="text-sm text-gray-400 mt-1">Verified validators review reports locally to filter duplicates and ensure high-integrity tickets.</p>
          </div>
        </div>
      </section>

      {/* Live Issues Feed */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Live Tickets</h2>
            <p className="text-sm text-gray-500 mt-0.5">Real-time civic issues from your community</p>
          </div>
          <Link href="/track" className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-sm">Loading live issues...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center gap-4 text-center border-white/5">
            <Camera className="w-10 h-10 text-violet-500/40" />
            <p className="font-bold text-white">No issues reported yet</p>
            <p className="text-sm text-gray-400">Be the first to report a civic issue in your area.</p>
            <Link
              href="/report"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Camera className="w-4 h-4" /> Report Now
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
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-gray-400'
                  )}>
                    {report.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">{report.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{report.location?.address || 'Unknown location'}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                  <span className="text-xs text-gray-500">{report.category}</span>
                  <span className="text-xs font-bold text-violet-400">▲ {report.upvotes ?? 0} upvotes</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
