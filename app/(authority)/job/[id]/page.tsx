'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Cpu
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function JobResolutionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const issueId = params.id;

  const [issue, setIssue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [remarks, setRemarks] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadIssueDetails() {
      try {
        const response = await fetch('/api/issues');
        const data = await response.json();
        if (data.success) {
          const matched = data.issues.find((iss: any) => iss.id === issueId);
          setIssue(matched || null);
        }
      } catch (err) {
        console.error('Failed to load issue details: ', err);
      } finally {
        setLoading(false);
      }
    }
    loadIssueDetails();
  }, [issueId]);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks || !proofFile) {
      setErrorMsg('Please enter resolution remarks and upload a proof photo.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('remarks', remarks);
      formData.append('authorityId', 'authority_ward_12_road');
      formData.append('resolutionProof', proofFile);

      const response = await fetch(`/api/issues/${issueId}/resolve`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setErrorMsg(result.error || 'Failed to submit resolution.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span>Loading ticket specifications...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-8 text-center glass-card max-w-md mx-auto text-gray-400">
        <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-2" />
        <h3 className="font-bold text-white">Job Ticket Not Found</h3>
        <p className="text-xs text-gray-400 mt-1">This ticket may have been deleted or archived.</p>
        <Link href="/dashboard" className="text-xs text-violet-400 mt-4 block hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-4 text-left">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to dispatch queue
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border",
            issue.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-orange-500/10 text-orange-400 border-orange-500/20'
          )}>
            {issue.severity}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">ID: {issue.id}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{issue.title}</h1>
      </div>

      {success && (
        <div className="glass-card p-6 border-emerald-500/30 bg-emerald-950/15 flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Ticket Marked as Resolved</h2>
          <p className="text-sm text-gray-300">Push notification sent to citizen reporter. Returning to dashboard...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/15 text-sm text-red-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Ticket Details Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider font-mono">Citizen Report</h3>
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500">Citizen Description</span>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">{issue.description}</p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span>{issue.location.address}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
            <Calendar className="w-3 h-3" />
            <span>Reported on: {formatDate(issue.createdAt)}</span>
          </div>
        </div>

        {/* AI summary diagnostic */}
        <div className="glass-card p-5 flex flex-col gap-4 border-violet-500/10">
          <h3 className="font-bold text-sm text-violet-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            Gemini Routing Summary
          </h3>
          
          {issue.aiMetadata?.autoSummary ? (
            <p className="text-xs text-violet-300 leading-relaxed font-medium italic bg-violet-950/20 p-3 rounded-lg border border-violet-500/10">
              &ldquo;{issue.aiMetadata.autoSummary}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-gray-500">No automated action summaries available.</p>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500">Auto-detected Category</span>
            <span className="text-xs font-bold text-white uppercase">{issue.category}</span>
          </div>
        </div>
      </div>

      {/* Resolution Submission form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-6 border-orange-500/15">
        <h2 className="text-lg font-bold text-white border-b border-white/5 pb-2">Submit Repair Proof</h2>

        {/* remarks inputs */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Resolution Remarks</label>
          <textarea 
            required
            rows={3}
            placeholder="Explain work done (e.g. repaved pothole with concrete, checked surrounding asphalt)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-zinc-900/60 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-orange-500/80 transition-colors"
          />
        </div>

        {/* proof picture uploader */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Upload Proof Image (Resolution Photo)</label>
          
          {!proofPreview ? (
            <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg py-8 cursor-pointer hover:border-orange-500/40 bg-zinc-900/40">
              <Camera className="w-8 h-8 text-gray-500 mb-1" />
              <span className="text-xs text-gray-400">Capture work proof photo</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handleProofChange}
                className="hidden" 
              />
            </label>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-white/15 aspect-video flex items-center justify-center bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={proofPreview} 
                alt="Proof preview" 
                className="max-h-full max-w-full object-contain" 
              />
              <button 
                type="button"
                onClick={() => {
                  setProofFile(null);
                  setProofPreview(null);
                }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              >
                Clear Photo
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !proofFile || !remarks}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold p-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all duration-200"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading Proof & Resolving...
            </>
          ) : (
            'Mark Incident Resolved'
          )}
        </button>
      </form>
    </div>
  );
}
