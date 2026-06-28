'use client';

import React, { useState } from 'react';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { 
  MapPin, 
  Filter, 
  ThumbsUp, 
  Check, 
  HelpCircle,
  Eye, 
  Map as MapIcon, 
  List as ListIcon,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function TrackPage() {
  const { user, getAuthToken } = useAuth();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const { t } = useLanguage();
  
  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const { issues, loading, error } = useIssues({
    status: selectedStatus || undefined,
    category: selectedCategory || undefined
  });

  const [validationLoading, setValidationLoading] = useState<string | null>(null);

  // Upvote/Validate Handler
  const handleValidate = async (issueId: string, statusVal: 'valid' | 'invalid') => {
    if (!user) {
      alert('You must be logged in to validate reports.');
      return;
    }
    setValidationLoading(issueId);

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/issues/${issueId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          userRole: user.role,
          status: statusVal,
          comments: 'Community verified verification.'
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to submit validation');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Verification request failed');
    } finally {
      setValidationLoading(null);
    }
  };

  const categories = ['pothole', 'streetlight', 'water', 'waste', 'encroachment', 'other'];
  const statuses = ['reported', 'open', 'validated', 'assigned', 'resolved', 'archived'];

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('trackTitle')}</h1>
          <p className="text-sm text-gray-400">{t('trackSub')}</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              viewMode === 'list' 
                ? "bg-violet-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white"
            )}
          >
            <ListIcon className="w-3.5 h-3.5" />
            {t('listView')}
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              viewMode === 'map' 
                ? "bg-violet-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white"
            )}
          >
            <MapIcon className="w-3.5 h-3.5" />
            {t('interactiveMap')}
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4 border-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <Filter className="w-4 h-4 text-violet-400" />
          {t('filterLabel')}
        </div>

        {/* Category Filter */}
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="">{t('allStatuses')}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>

        {/* Reset button */}
        {(selectedCategory || selectedStatus) && (
          <button 
            onClick={() => {
              setSelectedCategory('');
              setSelectedStatus('');
            }}
            className="text-xs text-violet-400 hover:underline"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Main View Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span>{t('syncLive')}</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-400 bg-red-950/10 border border-red-500/20 rounded-xl">
          {error}
        </div>
      ) : issues.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-zinc-900/20 border border-white/5 rounded-xl">
                    {t('noTickets')}
        </div>
      ) : viewMode === 'list' ? (
        // List View of Issues
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {issues.map((issue) => (
            <div 
              key={issue.id} 
              className="glass-card p-5 flex flex-col gap-4 border-white/5 hover:border-violet-500/20 transition-all duration-200"
            >
              {/* Badges / Status row */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border",
                  issue.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  issue.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                )}>
                  {issue.severity}
                </span>

                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                  issue.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' :
                  issue.status === 'validated' ? 'bg-violet-500/15 text-violet-400' :
                  issue.status === 'assigned' ? 'bg-orange-500/15 text-orange-400' :
                  'bg-zinc-800 text-gray-400'
                )}>
                  {issue.status}
                </span>
              </div>

              {/* Title & description */}
              <div>
                <h3 className="font-bold text-white text-lg line-clamp-1">{issue.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mt-1">{issue.description}</p>
                <div className="flex items-center gap-1 text-xs text-violet-400 mt-2 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{issue.location.address}</span>
                </div>
              </div>

              {/* AI summary snippet */}
              {issue.aiMetadata?.autoSummary && (
                <div className="bg-zinc-950/60 border border-white/5 rounded-lg p-2.5 text-[11px] text-gray-300 font-medium">
                  <span className="font-bold text-violet-400">{t('aiSummary')}</span> {issue.aiMetadata.autoSummary}
                </div>
              )}

              {/* Duplicate Warning */}
              {issue.aiMetadata?.possibleDuplicateOf && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 text-[11px] text-yellow-400 flex items-start gap-1.5">
                  <span className="font-bold">⚠️ Duplicate Candidate:</span> Similarity score: {(issue.aiMetadata.duplicateScore! * 100).toFixed(0)}%
                </div>
              )}

              {/* Bottom interaction row */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <span className="text-xs text-gray-500 font-mono">{formatDate(issue.createdAt)}</span>
                
                <div className="flex items-center gap-2">
                  {/* Upvote/Validate Button */}
                  <button 
                    onClick={() => handleValidate(issue.id, 'valid')}
                    disabled={validationLoading === issue.id || issue.status === 'resolved'}
                    className="flex items-center gap-1.5 bg-violet-600/10 hover:bg-violet-600/20 disabled:opacity-40 border border-violet-500/20 text-violet-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    {validationLoading === issue.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-3.5 h-3.5" />
                    )}
                    <span>{issue.upvotes || 0} {t('upvote')}</span>
                  </button>

                  {/* Validator specific quick invalidation */}
                  {user?.role === 'validator' && issue.status !== 'resolved' && (
                    <button 
                      onClick={() => handleValidate(issue.id, 'invalid')}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2 py-1.5 rounded-lg text-xs font-bold"
                    >
                      {t('flagSpam')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Mock Map View of Issues
        <div className="glass-card w-full h-[500px] relative overflow-hidden flex items-center justify-center border-white/10 bg-zinc-950">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="z-10 text-center flex flex-col items-center gap-3 p-6 max-w-sm">
            <MapIcon className="w-12 h-12 text-violet-500" />
            <h3 className="text-lg font-bold text-white">Live Tracking Grid Map</h3>
            <p className="text-xs text-gray-400">
              Pins representing reported civic incidents in your region. Google Maps API initializes here once client credentials are added.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {issues.slice(0, 5).map((iss) => (
                <div key={iss.id} className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  {iss.title.substring(0, 15)}...
                </div>
              ))}
            </div>
          </div>

          {/* Absolute Mock Map Pins */}
          <div className="absolute top-[20%] left-[30%] w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500 flex items-center justify-center animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
          </div>
          <div className="absolute top-[65%] left-[55%] w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="absolute top-[40%] left-[75%] w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          </div>
        </div>
      )}
    </div>
  );
}
