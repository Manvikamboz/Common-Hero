'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import {
  Trophy, Award, Shield, Star, CheckCircle2,
  Zap, Flame, Users, TrendingUp, Loader2
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { User } from '@/types';

const BADGE_DEFINITIONS = [
  { id: 'first_report', name: 'First Reporter', description: 'Submit your first validated civic report', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'neighborhood_watch', name: 'Neighborhood Watch', description: 'Submit 10 validated reports', icon: Shield, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { id: 'validator_pro', name: 'Validator Pro', description: 'Perform 50 community validations', icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { id: 'impact_maker', name: 'Impact Maker', description: '5 of your reports have been resolved', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'streak_hero', name: 'Streak Hero', description: 'Report for 7 consecutive days', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'community_pillar', name: 'Community Pillar', description: '100+ total upvotes received', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'top_contributor', name: 'Top Contributor', description: 'Rank #1 in your ward for a month', icon: Trophy, color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'data_driven', name: 'Data Driven', description: 'Your report triggered an AI prediction', icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch leaderboard data');
        const data = await res.json();
        if (data.success) {
          setLeaders(data.leaders);
        } else {
          throw new Error(data.error || 'Failed to load leaderboard');
        }
      } catch (err: any) {
        console.error('Failed to load leaderboard:', err);
        setError('Failed to load leaderboard. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, [user]);

  const userBadgeIds = new Set(user?.badges?.map((b) => b.id) ?? []);
  const currentUserRank = user ? leaders.findIndex((u) => u.id === user.id) + 1 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4">
      {/* Leaderboard Main Column */}
      <div className="lg:col-span-2 flex flex-col gap-6 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            Community Leaderboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Top civic contributors ranked by points.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-sm">Loading leaderboard...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 bg-red-950/10 border border-red-500/20 rounded-xl">{error}</div>
        ) : leaders.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center gap-4 text-center border-white/5">
            <Trophy className="w-10 h-10 text-amber-400/40" />
            <p className="font-bold text-white">No contributors yet</p>
            <p className="text-sm text-gray-400">Be the first to report a civic issue and earn points!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaders.length >= 3 && (
              <div className="flex items-end justify-center gap-3 px-4 py-6 glass-card bg-gradient-to-b from-zinc-900/50 to-zinc-950/30 border-white/5">
                {[leaders[1], leaders[0], leaders[2]].map((entry, podiumPos) => {
                  const actualRank = podiumPos === 0 ? 2 : podiumPos === 1 ? 1 : 3;
                  const heights = ['h-24', 'h-32', 'h-20'];
                  const colors = ['bg-zinc-400/20', 'bg-amber-400/20', 'bg-amber-700/20'];
                  const textColors = ['text-zinc-300', 'text-amber-400', 'text-amber-600'];
                  const isYou = entry?.id === user?.id;
                  return (
                    <div key={entry?.id} className="flex flex-col items-center gap-2 flex-1">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white', isYou ? 'bg-violet-600' : 'bg-gradient-to-br from-violet-600 to-indigo-600')}>
                        {getInitials(entry?.name ?? '')}
                      </div>
                      <p className={cn('text-[10px] font-bold text-center line-clamp-1 max-w-[80px]', isYou ? 'text-violet-300' : 'text-white')}>{entry?.name?.split(' ')[0]}</p>
                      <p className="text-[9px] text-amber-400 font-bold">★ {entry?.points}</p>
                      <div className={cn('w-full rounded-t-xl flex items-center justify-center font-bold text-2xl', heights[podiumPos], colors[podiumPos], textColors[podiumPos])}>
                        {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Rankings */}
            <div className="glass-card overflow-hidden border-white/5">
              <div className="divide-y divide-white/5">
                {leaders.map((entry, idx) => {
                  const rank = idx + 1;
                  const isYou = entry.id === user?.id;
                  const topBadge = entry.badges?.[0];
                  const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === topBadge?.id);
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center gap-4 px-5 py-4 transition-colors',
                        isYou ? 'bg-violet-500/10' : 'hover:bg-white/5'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                        rank === 1 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                        rank === 2 ? 'bg-zinc-300/20 text-zinc-300 border border-zinc-300/30' :
                        rank === 3 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/30' :
                        'bg-zinc-800 text-gray-400'
                      )}>
                        {rank}
                      </div>

                      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white', isYou ? 'bg-violet-600' : 'bg-gradient-to-br from-zinc-600 to-zinc-700')}>
                        {getInitials(entry.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={cn('font-bold text-sm', isYou ? 'text-violet-300' : 'text-white')}>
                          {entry.name} {isYou && <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
                        </h3>
                        <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{entry.issuesReported ?? 0} reports</span>
                          <span>·</span>
                          <span>{entry.issuesValidated ?? 0} validations</span>
                          {entry.wardId && <><span>·</span><span className="text-gray-600">{entry.wardId.replace('_', ' ')}</span></>}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-extrabold text-amber-400">★ {entry.points}</span>
                        {badgeDef && (
                          <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border', badgeDef.bg, badgeDef.border)}>
                            <badgeDef.icon className={cn('w-2.5 h-2.5', badgeDef.color)} />
                            <span className={badgeDef.color}>{badgeDef.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Achievements Sidebar */}
      <div className="flex flex-col gap-6 text-left">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Your Achievements</h2>
          <p className="text-sm text-gray-400 mt-1">Unlock badges to increase your verification weight.</p>
        </div>

        {/* User Profile Card */}
        {user ? (
          <div className="glass-card p-6 flex flex-col gap-4 border-violet-500/15">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg">
                {getInitials(user.name)}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{user.name}</h3>
                <p className="text-xs text-violet-400 font-bold uppercase tracking-wider font-mono">
                  {user.role} {user.wardId ? `· ${user.wardId.replace('_', ' ')}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
              {[
                { label: 'Points', value: user.points, color: 'text-amber-400' },
                { label: 'Reports', value: user.issuesReported, color: 'text-violet-400' },
                { label: 'Validated', value: user.issuesValidated, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={cn('text-xl font-extrabold', color)}>{value ?? 0}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {currentUserRank > 0 && (
              <div className="text-center text-xs text-gray-500">
                Your rank: <span className="text-violet-400 font-bold">#{currentUserRank}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-gray-500 border-white/5">
            <p className="text-sm">Sign in to see your achievements</p>
          </div>
        )}

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
