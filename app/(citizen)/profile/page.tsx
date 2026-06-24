'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Trophy, Star, ShieldCheck, Camera, MapPin, Clock, CheckCircle,
  AlertTriangle, Loader2, ArrowRight, Medal, Flame, TrendingUp,
  FileText, BarChart3, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Badge {
  id: string;
  name: string;
  description: string;
  awardedAt: string;
}

interface IssueItem {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  upvotes: number;
  createdAt: string;
  location?: { address: string };
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    role: string;
    points: number;
    issuesReported: number;
    issuesValidated: number;
    issuesResolved?: number;
    badges: Badge[];
    wardId?: string;
    createdAt: string;
  };
  issues: IssueItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const STATUS_STYLE: Record<string, string> = {
  resolved: 'bg-emerald-500/10 text-emerald-400',
  validated: 'bg-sky-500/10 text-sky-400',
  open: 'bg-violet-500/10 text-violet-400',
  in_progress: 'bg-amber-500/10 text-amber-400',
  archived: 'bg-zinc-700 text-gray-500',
};

const BADGE_COLORS: Record<string, string> = {
  first_report: 'from-amber-500 to-orange-500',
  neighborhood_watch: 'from-blue-500 to-sky-500',
  validator_pro: 'from-emerald-500 to-teal-500',
  impact_maker: 'from-violet-500 to-purple-500',
  streak_hero: 'from-rose-500 to-pink-500',
  community_pillar: 'from-indigo-500 to-blue-500',
  top_contributor: 'from-yellow-500 to-amber-500',
  data_driven: 'from-cyan-500 to-sky-500',
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_report: <Star className="w-5 h-5" />,
  neighborhood_watch: <ShieldCheck className="w-5 h-5" />,
  validator_pro: <CheckCircle className="w-5 h-5" />,
  impact_maker: <Flame className="w-5 h-5" />,
  streak_hero: <TrendingUp className="w-5 h-5" />,
  community_pillar: <Trophy className="w-5 h-5" />,
  top_contributor: <Medal className="w-5 h-5" />,
  data_driven: <BarChart3 className="w-5 h-5" />,
};

function getUserInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}


export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, getAuthToken } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'badges'>('reports');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        const res = await fetch(`/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProfile(data);
            return;
          }
        }
        // Fallback: use mock data built from auth user
        setProfile(buildMockProfile(user));
      } catch {
        setProfile(buildMockProfile(user));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, getAuthToken]);

  // ── Loading state ──
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <p className="text-gray-400 text-sm">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm text-white hover:bg-zinc-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!user || !profile) return null;

  const { user: profileUser, issues } = profile;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const openCount = issues.filter((i) => ['open', 'validated', 'in_progress'].includes(i.status)).length;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 py-6">

      {/* ── Hero Card ── */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/5 pointer-events-none" />

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {profileUser.photoUrl ? (
            <Image
              src={profileUser.photoUrl}
              alt={profileUser.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-2xl border-2 border-violet-500/30 shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-violet-500/30">
              <span className="text-3xl font-extrabold text-white">{getUserInitials(profileUser.name)}</span>
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-violet-500/30 text-[10px] font-bold text-violet-400 uppercase">
            {profileUser.role}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 text-center sm:text-left flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-white tracking-tight truncate">{profileUser.name}</h1>
          <p className="text-sm text-gray-400">{profileUser.email}</p>
          {profileUser.wardId && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              <span>{profileUser.wardId.replace('_', ' ').toUpperCase()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start">
            <Clock className="w-3.5 h-3.5" />
            <span>Member since {new Date(profileUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Points display */}
        <div className="flex flex-col items-center gap-1 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-6 py-4 flex-shrink-0">
          <span className="text-3xl font-extrabold text-white">{profileUser.points.toLocaleString()}</span>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Points</span>
          <div className="mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
            ★ Community Hero
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Reported', value: profileUser.issuesReported, icon: <Camera className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Validated', value: profileUser.issuesValidated, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Resolved', value: resolvedCount, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
          { label: 'Open', value: openCount, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 flex flex-col items-center gap-2 border', stat.bg)}>
            <div className={stat.color}>{stat.icon}</div>
            <span className="text-2xl font-extrabold text-white">{stat.value}</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-xl border border-white/5 w-fit">
        {(['reports', 'badges'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {tab === 'reports' ? (
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> My Reports</span>
            ) : (
              <span className="flex items-center gap-2"><Medal className="w-4 h-4" /> Badges</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Reports Tab ── */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">
          {issues.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-white font-bold">No reports yet</p>
              <p className="text-sm text-gray-400">Start contributing by reporting a civic issue in your area.</p>
              <Link
                href="/report"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Camera className="w-4 h-4" /> Report an Issue
              </Link>
            </div>
          ) : (
            issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="glass-card p-5 flex flex-col gap-3 hover:border-white/15 transition-all duration-200 group border border-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white line-clamp-1 group-hover:text-violet-300 transition-colors flex-1">
                    {issue.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.low)}>
                    {issue.severity}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase', STATUS_STYLE[issue.status] || 'bg-zinc-800 text-gray-400')}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-zinc-800/60">
                    {issue.category}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-violet-400/60" />
                    <span className="truncate max-w-[200px]">{issue.location?.address || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-violet-400 font-semibold">▲ {issue.upvotes}</span>
                    <span>{timeAgo(issue.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}

          {issues.length > 0 && (
            <Link
              href="/track"
              className="text-center text-sm font-semibold text-violet-400 hover:text-violet-300 py-2 transition-colors"
            >
              Track all issues →
            </Link>
          )}
        </div>
      )}

      {/* ── Badges Tab ── */}
      {activeTab === 'badges' && (
        <div className="flex flex-col gap-4">
          {profileUser.badges.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-white font-bold">No badges yet</p>
              <p className="text-sm text-gray-400">Report and validate issues to earn badges and climb the leaderboard.</p>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 rounded-xl text-white text-sm font-bold hover:bg-zinc-700 transition-colors border border-white/10"
              >
                <Trophy className="w-4 h-4 text-amber-400" /> View Leaderboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileUser.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="glass-card p-5 flex items-start gap-4 border border-white/5"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-lg',
                    BADGE_COLORS[badge.id] || 'from-gray-600 to-gray-700'
                  )}>
                    {BADGE_ICONS[badge.id] || <Star className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{badge.description}</p>
                    <p className="text-[10px] text-gray-600 mt-1.5">
                      Earned {new Date(badge.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Locked badges preview */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Badges to Unlock</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'validator_pro', name: 'Validator Pro', hint: 'Validate 25+ issues' },
                { id: 'impact_maker', name: 'Impact Maker', hint: '5 issues resolved' },
                { id: 'streak_hero', name: 'Streak Hero', hint: 'Report 7 days in a row' },
                { id: 'top_contributor', name: 'Top Contributor', hint: 'Reach 500 points' },
              ]
                .filter((b) => !profileUser.badges.some((earned) => earned.id === b.id))
                .map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900/40 border border-white/5 opacity-50">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-gray-600">
                      {BADGE_ICONS[b.id] || <Star className="w-5 h-5" />}
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 text-center">{b.name}</p>
                    <p className="text-[9px] text-gray-600 text-center">{b.hint}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
