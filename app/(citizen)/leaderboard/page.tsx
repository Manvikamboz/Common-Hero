'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Trophy, Award, Shield, Star, CheckCircle2,
  Zap, Flame, Users, TrendingUp
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { User } from '@/types';

type TabType = 'weekly' | 'monthly' | 'alltime';

const BADGE_DEFINITIONS = [
  { id: 'first_report', name: 'First Reporter', description: 'Submit your first validated civic report', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', threshold: 1 },
  { id: 'neighborhood_watch', name: 'Neighborhood Watch', description: 'Submit 10 validated reports', icon: Shield, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', threshold: 10 },
  { id: 'validator_pro', name: 'Validator Pro', description: 'Perform 50 community validations', icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', threshold: 50 },
  { id: 'impact_maker', name: 'Impact Maker', description: '5 of your reports have been resolved', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', threshold: 5 },
  { id: 'streak_hero', name: 'Streak Hero', description: 'Report for 7 consecutive days', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', threshold: 7 },
  { id: 'community_pillar', name: 'Community Pillar', description: '100+ total upvotes received', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', threshold: 100 },
  { id: 'top_contributor', name: 'Top Contributor', description: 'Rank #1 in your ward for a month', icon: Trophy, color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/20', threshold: 1 },
  { id: 'data_driven', name: 'Data Driven', description: 'Your report triggered an AI prediction', icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', threshold: 1 },
];

const MOCK_LEADERBOARD: Record<TabType, Array<{
  rank: number; name: string; points: number; reports: number; validations: number;
  badgeId: string; wardId: string;
}>> = {
  weekly: [
    { rank: 1, name: 'Vikram Malhotra', points: 145, reports: 6, validations: 18, badgeId: 'validator_pro', wardId: 'Ward 08' },
    { rank: 2, name: 'Ananya Sharma', points: 130, reports: 8, validations: 12, badgeId: 'impact_maker', wardId: 'Ward 12' },
    { rank: 3, name: 'Rohan Deshmukh', points: 98, reports: 5, validations: 9, badgeId: 'neighborhood_watch', wardId: 'Ward 05' },
    { rank: 4, name: 'Priya Iyer', points: 87, reports: 4, validations: 11, badgeId: 'neighborhood_watch', wardId: 'Ward 03' },
    { rank: 5, name: 'Manvi Kamboj', points: 75, reports: 3, validations: 7, badgeId: 'first_report', wardId: 'Ward 12' },
    { rank: 6, name: 'Arjun Nair', points: 62, reports: 2, validations: 9, badgeId: 'first_report', wardId: 'Ward 01' },
    { rank: 7, name: 'Kavita Singh', points: 54, reports: 3, validations: 4, badgeId: 'first_report', wardId: 'Ward 08' },
  ],
  monthly: [
    { rank: 1, name: 'Ananya Sharma', points: 420, reports: 18, validations: 32, badgeId: 'impact_maker', wardId: 'Ward 12' },
    { rank: 2, name: 'Vikram Malhotra', points: 380, reports: 12, validations: 46, badgeId: 'validator_pro', wardId: 'Ward 08' },
    { rank: 3, name: 'Rohan Deshmukh', points: 310, reports: 15, validations: 14, badgeId: 'neighborhood_watch', wardId: 'Ward 05' },
    { rank: 4, name: 'Priya Iyer', points: 290, reports: 9, validations: 28, badgeId: 'neighborhood_watch', wardId: 'Ward 03' },
    { rank: 5, name: 'Manvi Kamboj', points: 240, reports: 8, validations: 18, badgeId: 'neighborhood_watch', wardId: 'Ward 12' },
    { rank: 6, name: 'Karan Mehra', points: 190, reports: 5, validations: 12, badgeId: 'first_report', wardId: 'Ward 01' },
    { rank: 7, name: 'Siddharth Sen', points: 145, reports: 4, validations: 9, badgeId: 'first_report', wardId: 'Ward 05' },
  ],
  alltime: [
    { rank: 1, name: 'Ananya Sharma', points: 2840, reports: 124, validations: 298, badgeId: 'top_contributor', wardId: 'Ward 12' },
    { rank: 2, name: 'Vikram Malhotra', points: 2620, reports: 89, validations: 412, badgeId: 'validator_pro', wardId: 'Ward 08' },
    { rank: 3, name: 'Priya Iyer', points: 1980, reports: 78, validations: 185, badgeId: 'impact_maker', wardId: 'Ward 03' },
    { rank: 4, name: 'Rohan Deshmukh', points: 1740, reports: 95, validations: 102, badgeId: 'neighborhood_watch', wardId: 'Ward 05' },
    { rank: 5, name: 'Manvi Kamboj', points: 1240, reports: 52, validations: 98, badgeId: 'neighborhood_watch', wardId: 'Ward 12' },
    { rank: 6, name: 'Karan Mehra', points: 980, reports: 34, validations: 78, badgeId: 'neighborhood_watch', wardId: 'Ward 01' },
    { rank: 7, name: 'Siddharth Sen', points: 820, reports: 28, validations: 65, badgeId: 'first_report', wardId: 'Ward 05' },
  ],
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>('monthly');
  const leaderboard = MOCK_LEADERBOARD[tab];

  const currentUserEntry = leaderboard.find((u) => u.name.includes('Manvi'));
  const userBadgeIds = new Set(user?.badges.map((b) => b.id) ?? ['first_report', 'neighborhood_watch']);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4">
      {/* Leaderboard Main Column */}
      <div className="lg:col-span-2 flex flex-col gap-6 text-left">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            Ward Leaderboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Top civic contributors ranked by points, reports, and validations.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-xl w-fit">
          {(['weekly', 'monthly', 'alltime'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize',
                tab === t ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              {t === 'alltime' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 px-4 py-6 glass-card bg-gradient-to-b from-zinc-900/50 to-zinc-950/30 border-white/5">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, podiumPos) => {
            const actualRank = podiumPos === 0 ? 2 : podiumPos === 1 ? 1 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            const colors = ['bg-zinc-400/20', 'bg-amber-400/20', 'bg-amber-700/20'];
            const textColors = ['text-zinc-300', 'text-amber-400', 'text-amber-600'];
            const isYou = entry?.name.includes('Manvi');
            return (
              <div key={entry?.rank} className="flex flex-col items-center gap-2 flex-1">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white', isYou ? 'bg-violet-600' : 'bg-gradient-to-br from-violet-600 to-indigo-600')}>
                  {getInitials(entry?.name ?? '')}
                </div>
                <p className={cn('text-[10px] font-bold text-center line-clamp-1 max-w-[80px]', isYou ? 'text-violet-300' : 'text-white')}>{entry?.name.split(' ')[0]}</p>
                <p className="text-[9px] text-amber-400 font-bold">★ {entry?.points}</p>
                <div className={cn('w-full rounded-t-xl flex items-center justify-center font-bold text-2xl', heights[podiumPos], colors[podiumPos], textColors[podiumPos])}>
                  {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Rankings */}
        <div className="glass-card overflow-hidden border-white/5">
          <div className="divide-y divide-white/5">
            {leaderboard.map((entry) => {
              const isYou = entry.name.includes('Manvi');
              const badge = BADGE_DEFINITIONS.find((b) => b.id === entry.badgeId);
              return (
                <div
                  key={entry.rank}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 transition-colors',
                    isYou ? 'bg-violet-500/10' : 'hover:bg-white/5'
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                    entry.rank === 1 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                    entry.rank === 2 ? 'bg-zinc-300/20 text-zinc-300 border border-zinc-300/30' :
                    entry.rank === 3 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/30' :
                    'bg-zinc-800 text-gray-400'
                  )}>
                    {entry.rank}
                  </div>

                  {/* Avatar */}
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white', isYou ? 'bg-violet-600' : 'bg-gradient-to-br from-zinc-600 to-zinc-700')}>
                    {getInitials(entry.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-bold text-sm', isYou ? 'text-violet-300' : 'text-white')}>
                      {entry.name} {isYou && <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
                    </h3>
                    <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{entry.reports} reports</span>
                      <span>·</span>
                      <span>{entry.validations} validations</span>
                      <span>·</span>
                      <span className="text-gray-600">{entry.wardId}</span>
                    </p>
                  </div>

                  {/* Badge + Points */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-extrabold text-amber-400">★ {entry.points}</span>
                    {badge && (
                      <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border', badge.bg, badge.border)}>
                        <badge.icon className={cn('w-2.5 h-2.5', badge.color)} />
                        <span className={badge.color}>{badge.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievements Sidebar */}
      <div className="flex flex-col gap-6 text-left">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Your Achievements</h2>
          <p className="text-sm text-gray-400 mt-1">Unlock badges to increase your verification weight.</p>
        </div>

        {/* User Profile Card */}
        <div className="glass-card p-6 flex flex-col gap-4 border-violet-500/15">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg">
              MK
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Manvi Kamboj</h3>
              <p className="text-xs text-violet-400 font-bold uppercase tracking-wider font-mono">Neighborhood Watch · Ward 12</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
            {[
              { label: 'Points', value: currentUserEntry?.points ?? 240, color: 'text-amber-400' },
              { label: 'Reports', value: currentUserEntry?.reports ?? 8, color: 'text-violet-400' },
              { label: 'Validated', value: currentUserEntry?.validations ?? 18, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={cn('text-xl font-extrabold', color)}>{value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Points progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">Next rank: Validator Pro</span>
              <span className="text-violet-400 font-bold">240 / 500 pts</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all" style={{ width: '48%' }} />
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white">All Badges</h3>
          {BADGE_DEFINITIONS.map((badge) => {
            const unlocked = userBadgeIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={cn(
                  'glass-card p-4 flex items-center gap-4 border-white/5 transition-all',
                  unlocked ? 'opacity-100' : 'opacity-40 grayscale'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border shrink-0', badge.bg, badge.border)}>
                  <badge.icon className={cn('w-5 h-5', badge.color)} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white">{badge.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{badge.description}</p>
                </div>
                {unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-auto" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
