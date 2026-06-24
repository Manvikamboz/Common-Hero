'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getSeverityClasses, getStatusClasses, cn } from '@/lib/utils';
import {
  MapPin, CheckCircle, Loader2, ThumbsUp, Clock, Share2,
  Send, MessageCircle, AlertTriangle, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import type { Issue, Comment } from '@/types';

const STATUS_STEPS = ['reported', 'validated', 'assigned', 'in_progress', 'resolved'];

const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  validated: 'Community Validated',
  assigned: 'Authority Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved ✓',
};

const DEMO_COMMENTS: Comment[] = [
  { id: 'c1', issueId: 'x', authorId: 'u1', authorName: 'Rahul Singh', text: 'I reported this too! The pothole is really dangerous for bikes.', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'c2', issueId: 'x', authorId: 'u2', authorName: 'Priya Menon', text: 'Can authorities fast-track this? Two-wheelers have already been damaged.', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'c3', issueId: 'x', authorId: 'u3', authorName: 'Ward Supervisor', text: 'We have assigned a crew. Work scheduled for tomorrow morning.', createdAt: new Date(Date.now() - 600000).toISOString() },
];

const DEMO_ISSUE: Issue = {
  id: 'demo_001',
  title: 'Large pothole near bus stop on MG Road',
  description: 'Deep pothole approximately 60cm wide causing vehicle damage and significant hazard for two-wheelers and cyclists. Water collects inside creating additional danger in rain.',
  category: 'pothole',
  severity: 'high',
  status: 'validated',
  location: { latitude: 28.6139, longitude: 77.2090, address: 'MG Road, Near Bus Stop 12A, New Delhi', geohash: 'ttnfv2' },
  mediaUrls: [],
  reportedBy: 'demo_user_001',
  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  upvotes: 14,
  validations: [
    { validatorId: 'v1', validatedAt: new Date(Date.now() - 86400000).toISOString(), status: 'valid', comments: 'Confirmed pothole on site' },
    { validatorId: 'v2', validatedAt: new Date(Date.now() - 43200000).toISOString(), status: 'valid', comments: 'Definitely dangerous for bikes' },
  ],
  aiMetadata: {
    categoryConfidence: 0.94,
    originalCategory: 'pothole',
    suggestedSeverity: 'high',
    autoSummary: 'Action Brief: Fill deep pothole on MG Road using asphalt. Location Detail: Adjacent to Bus Stop 12A, affecting two-wheeler lane.',
  },
  wardId: 'ward_12',
};

export default function IssueDetailPage({ params }: { params: { id: string } }) {
  const { user, getAuthToken } = useAuth();
  const issueId = params.id;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [disputeRemarks, setDisputeRemarks] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputed, setDisputed] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const handleDispute = async () => {
    if (!disputeRemarks.trim() || !user) return;
    setDisputeLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/issues/${issueId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks: disputeRemarks.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputed(true);
        setDisputeRemarks('');
        alert('Issue resolution disputed! The issue has been reopened for further authority review.');
      } else {
        alert(data.error || 'Failed to file dispute');
      }
    } catch (err: any) {
      alert(err.message || 'Unexpected error occurred.');
    } finally {
      setDisputeLoading(false);
    }
  };

  const isDemoMode =
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key' ||
    issueId.startsWith('demo_');

  useEffect(() => {
    if (isDemoMode) {
      setIssue(DEMO_ISSUE);
      setComments(DEMO_COMMENTS);
      setLoading(false);
      return;
    }

    // Real-time Firestore listener
    const issueUnsub = onSnapshot(doc(db, 'issues', issueId), (snap) => {
      if (snap.exists()) {
        setIssue({ id: snap.id, ...snap.data() } as Issue);
      }
      setLoading(false);
    });

    const commentsQ = query(collection(db, 'issues', issueId, 'comments'), orderBy('createdAt', 'asc'));
    const commentsUnsub = onSnapshot(commentsQ, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
    });

    return () => { issueUnsub(); commentsUnsub(); };
  }, [issueId, isDemoMode]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleValidate = async () => {
    if (!user) return;
    setValidationLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/issues/${issueId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, userRole: user.role, status: 'valid', comments: 'Verified from detail view' }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error);
      }
    } finally {
      setValidationLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setPostingComment(true);
    try {
      if (!isDemoMode) {
        await addDoc(collection(db, 'issues', issueId, 'comments'), {
          issueId,
          authorId: user.id,
          authorName: user.name,
          authorPhotoUrl: user.photoUrl || null,
          text: newComment.trim(),
          createdAt: new Date().toISOString(),
        });
      } else {
        setComments((prev) => [...prev, {
          id: `local_${Date.now()}`,
          issueId,
          authorId: user.id,
          authorName: user.name,
          text: newComment.trim(),
          createdAt: new Date().toISOString(),
        }]);
      }
      setNewComment('');
    } finally {
      setPostingComment(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: issue?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span>Loading issue details...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
        <h2 className="font-bold text-white text-xl">Issue Not Found</h2>
        <p className="text-sm text-gray-400 mt-1">This report may have been archived.</p>
        <Link href="/map" className="mt-4 inline-block text-sm text-violet-400 hover:underline">← Back to Map</Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(issue.status);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-4">
      {/* Back */}
      <Link href="/map" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to Map
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border', getSeverityClasses(issue.severity))}>
            {issue.severity}
          </span>
          <span className={cn('px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase', getStatusClasses(issue.status))}>
            {issue.status.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-gray-500 font-mono ml-auto">#{issueId.slice(-8).toUpperCase()}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white leading-tight">{issue.title}</h1>
        <div className="flex items-center gap-1.5 text-sm text-violet-400">
          <MapPin className="w-4 h-4" />
          <span>{issue.location.address}</span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Progress Timeline</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {STATUS_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                  i <= currentStepIndex
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-zinc-900 border-white/10 text-gray-600'
                )}>
                  {i < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <span className={cn('text-[9px] font-semibold text-center leading-tight', i <= currentStepIndex ? 'text-violet-400' : 'text-gray-600')}>
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-1 mb-6 transition-all min-w-[16px]', i < currentStepIndex ? 'bg-violet-600' : 'bg-white/5')} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Citizen Report</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{issue.description}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
            <Clock className="w-3 h-3" />
            {formatDate(issue.createdAt)}
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col gap-4 border-violet-500/10">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Gemini AI Analysis</h3>
          {issue.aiMetadata?.autoSummary && (
            <p className="text-xs text-violet-200 leading-relaxed italic bg-violet-950/20 p-3 rounded-lg border border-violet-500/10">
              &ldquo;{issue.aiMetadata.autoSummary}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] text-gray-500 uppercase font-mono">Category</span>
              <p className="text-xs font-bold text-white mt-0.5 uppercase">{issue.category}</p>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 uppercase font-mono">AI Confidence</span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">{((issue.aiMetadata?.categoryConfidence ?? 0) * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Validation */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Community Validations ({issue.validations.length})</h3>
          <button
            onClick={handleValidate}
            disabled={validationLoading || issue.status === 'resolved'}
            className="flex items-center gap-1.5 bg-violet-600/15 hover:bg-violet-600/25 disabled:opacity-40 border border-violet-500/25 text-violet-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            {validationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
            Validate ({issue.upvotes})
          </button>
        </div>
        {issue.validations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {issue.validations.map((v, i) => (
              <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-full px-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
                  {v.validatorId.slice(-2).toUpperCase()}
                </div>
                <span className="text-[10px] text-gray-400">{formatDate(v.validatedAt, true)}</span>
                <span className={cn('text-[9px] font-bold', v.status === 'valid' ? 'text-emerald-400' : 'text-red-400')}>
                  {v.status === 'valid' ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No validations yet. Be the first to confirm!</p>
        )}
      </div>

      {/* Dispute Resolution Flow */}
      {issue.status === 'resolved' && user && !disputed && (
        <div className="glass-card p-5 flex flex-col gap-4 border-red-500/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Dispute Resolution proof?
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              If the issue was resolved unsatisfactorily, you can reopen it by providing details below.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              rows={3}
              value={disputeRemarks}
              onChange={(e) => setDisputeRemarks(e.target.value)}
              placeholder="Explain why this resolution is incorrect or incomplete..."
              className="w-full bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500/50"
            />
            <button
              onClick={handleDispute}
              disabled={disputeLoading || !disputeRemarks.trim()}
              className="self-end px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl text-xs font-bold text-white transition-colors"
            >
              {disputeLoading ? 'Reopening...' : 'Dispute & Reopen Issue'}
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Discussion ({comments.length})</h3>
        </div>

        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {c.authorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{c.authorName}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{formatDate(c.createdAt, true)}</span>
                </div>
                <p className="text-xs text-gray-300 bg-zinc-900/60 border border-white/5 rounded-lg rounded-tl-none p-2.5 leading-relaxed">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        <div className="flex gap-2 border-t border-white/5 pt-4">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {user?.name.slice(0, 2).toUpperCase() ?? 'MK'}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              placeholder="Add a comment..."
              className="flex-1 bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={handlePostComment}
              disabled={postingComment || !newComment.trim()}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-white transition-colors"
            >
              {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
      >
        <Share2 className="w-4 h-4" />
        {shared ? 'Link Copied!' : 'Share this Report'}
      </button>
    </div>
  );
}
