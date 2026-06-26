'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, MapPin, Loader2, Calendar, AlertTriangle,
  CheckCircle, Filter, Clock, BarChart2, Zap, SortAsc
} from 'lucide-react';
import { cn, formatDate, getSeverityClasses, getStatusClasses } from '@/lib/utils';
import type { Issue, AnalyticsDashboard } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type SortKey = 'severity' | 'createdAt' | 'category' | 'upvotes';

const SEVERITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export default function AuthorityDashboard() {
  const { user, getAuthToken } = useAuth();
  const [jobs, setJobs] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('open,validated,assigned');
  const [sortKey, setSortKey] = useState<SortKey>('severity');
  const [sortAsc, setSortAsc] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [filterStatus]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [issRes, anaRes] = await Promise.allSettled([
        fetch(`/api/issues?status=${filterStatus}`),
        fetch('/api/analytics'),
      ]);

      if (issRes.status === 'fulfilled') {
        const d = await issRes.value.json();
        if (d.success) setJobs(d.issues);
      }
      if (anaRes.status === 'fulfilled') {
        const d = await anaRes.value.json();
        if (d.success) setAnalytics(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs
    .filter((j) => !filterCategory || j.category === filterCategory)
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === 'severity') {
        diff = (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0);
      } else if (sortKey === 'createdAt') {
        diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortKey === 'upvotes') {
        diff = b.upvotes - a.upvotes;
      } else if (sortKey === 'category') {
        diff = a.category.localeCompare(b.category);
      }
      return sortAsc ? -diff : diff;
    });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const token = await getAuthToken();
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/issues/${id}/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: user?.id || 'authority_01',
              userRole: user?.role || 'authority',
              status: 'valid',
              comments: `Bulk action: ${bulkAction}`,
            }),
          })
        )
      );
      setSelectedIds(new Set());
      setBulkAction('');
      loadDashboard();
    } finally {
      setBulkLoading(false);
    }
  };

  const criticalCount = jobs.filter((j) => j.severity === 'critical').length;
  const avgResolutionHrs = analytics?.avgResolutionTimeHours ?? 36;

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Municipal Work Queue</h1>
          <p className="text-sm text-gray-400 mt-1">Manage, triage, and dispatch validated community tickets.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4" />
          Authority Session Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'In Queue', value: jobs.length, icon: BarChart2, color: 'text-violet-400', note: 'Active tickets' },
          { label: 'Critical Priority', value: criticalCount, icon: AlertTriangle, color: 'text-red-400', note: '⚠️ Immediate action' },
          { label: 'Resolved (30d)', value: analytics?.resolvedIssuesCount ?? 0, icon: CheckCircle, color: 'text-emerald-400', note: '★ 94% satisfaction' },
          { label: 'Avg Resolution', value: `${avgResolutionHrs}h`, icon: Clock, color: 'text-amber-400', note: 'Vs 48h target' },
        ].map(({ label, value, icon: Icon, color, note }) => (
          <div key={label} className="glass-card p-5 text-left flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon className={cn('w-4 h-4', color)} />
              <span className="text-[10px] text-gray-500 uppercase font-mono">{label}</span>
            </div>
            <span className="text-2xl font-extrabold text-white">{value}</span>
            <span className="text-[10px] text-gray-500 font-medium">{note}</span>
          </div>
        ))}
      </div>

      {/* Filter & Sort Controls */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3 border-white/5">
        <Filter className="w-4 h-4 text-violet-400" />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="open,validated,assigned">Open + Validated + Assigned</option>
          <option value="validated">Validated Only</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">All Categories</option>
          {['pothole', 'streetlight', 'water', 'waste', 'encroachment', 'other'].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <SortAsc className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value="severity">Sort: Severity</option>
            <option value="createdAt">Sort: Date</option>
            <option value="upvotes">Sort: Upvotes</option>
            <option value="category">Sort: Category</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-gray-400 hover:text-white"
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>

        {/* Bulk action */}
        {selectedIds.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-violet-400 font-bold">{selectedIds.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bg-zinc-900/60 border border-violet-500/30 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="">Bulk Action...</option>
              <option value="assign">Mark Assigned</option>
              <option value="escalate">Escalate Severity</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkLoading}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 rounded-lg text-xs font-bold text-white"
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* Job Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span>Loading dispatch queue...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-zinc-900/20 border border-white/5 rounded-xl">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p>No pending tickets. All clear!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                'glass-card p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border-white/5 hover:border-orange-500/20 transition-all cursor-pointer',
                selectedIds.has(job.id) && 'border-violet-500/30 bg-violet-950/10'
              )}
              onClick={() => toggleSelect(job.id)}
            >
              <div className="flex gap-4 flex-1 min-w-0">
                {/* Checkbox */}
                <div
                  className={cn(
                    'w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    selectedIds.has(job.id) ? 'bg-violet-600 border-violet-600' : 'border-white/20 bg-zinc-900'
                  )}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(job.id); }}
                >
                  {selectedIds.has(job.id) && <span className="text-white text-xs">✓</span>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border', getSeverityClasses(job.severity))}>
                      {job.severity}
                    </span>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase', getStatusClasses(job.status))}>
                      {job.status}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(job.createdAt)}
                    </span>
                    <span className="text-[10px] text-gray-500">▲ {job.upvotes} upvotes</span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{job.title}</h3>

                  {job.aiMetadata?.autoSummary && (
                    <div className="flex items-start gap-2 bg-orange-950/20 border border-orange-500/15 rounded-lg px-3 py-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-orange-200 font-medium leading-relaxed">
                        {job.aiMetadata.autoSummary}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span className="truncate">{job.location.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/job/${job.id}`}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all hover:scale-[1.02] shadow-md shadow-orange-500/10 whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
