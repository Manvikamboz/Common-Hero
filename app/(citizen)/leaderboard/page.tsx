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
import { useLanguage } from '@/context/LanguageContext';

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
  const { t } = useLanguage();
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6 py-4">
      {/* Leaderboard Main Column */}
      <div className="w-full flex flex-col gap-6 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            {t('leaderboardTitle')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t('leaderboardSub')}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-sm">{t('loadingLeaderboard')}</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 bg-red-950/10 border border-red-500/20 rounded-xl">{error}</div>
        ) : leaders.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center gap-4 text-center border-white/5">
            <Trophy className="w-10 h-10 text-amber-400/40" />
            <p className="font-bold text-white">{t('noContributors')}</p>
            <p className="text-sm text-gray-400">{t('noContributorsSub')}</p>
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
                          <span>{entry.issuesReported ?? 0} {t('reports')}</span>
                          <span>·</span>
                          <span>{entry.issuesValidated ?? 0} {t('validations')}</span>
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
    </div>
  );
}
