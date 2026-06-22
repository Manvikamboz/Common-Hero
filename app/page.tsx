import React from 'react';
import Link from 'next/link';
import { 
  Camera, 
  MapPin, 
  Trophy, 
  Cpu, 
  ShieldCheck, 
  ChevronRight, 
  Zap,
  ArrowRight,
  MapPinIcon,
  Flame,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  // Mock recent reports to display on dashboard
  const sampleReports = [
    { id: '1', title: 'Major road crater', category: 'pothole', severity: 'critical', location: 'Main Rd, Sector 4', status: 'assigned', upvotes: 24 },
    { id: '2', title: 'Streetlights out since Tuesday', category: 'streetlight', severity: 'high', location: 'Park Lane Ave', status: 'validated', upvotes: 15 },
    { id: '3', title: 'Broken water main leaking', category: 'water', severity: 'medium', location: '12th Cross Junction', status: 'resolved', upvotes: 42 },
  ];

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
            Community Hero connects citizens, validators, and municipal teams in real time. Powered by Google AI Studio (Gemini 1.5 Pro) for automated categorizing and priority mapping.
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

        {/* Floating Live Issue Preview (Visual WOW Card) */}
        <div className="flex-1 relative w-full max-w-lg mt-8 md:mt-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-sky-600/20 blur-3xl -z-10" />
          <div className="glass-card p-6 w-full flex flex-col gap-6 glow-purple border-white/15">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold tracking-wide uppercase text-emerald-400">Live Feed</span>
              </div>
              <span className="text-xs text-gray-500">Just reported in Ward 12</span>
            </div>

            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg bg-zinc-800/80 border border-white/10 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                {/* Visual Representation of a civic problem */}
                <Camera className="w-8 h-8 text-violet-400/50" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] py-0.5 text-center text-gray-300 font-medium font-mono uppercase">
                  pothole_crater.webp
                </div>
              </div>
              <div className="flex flex-col gap-1.5 justify-center">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/10 text-red-400 border border-red-500/25 w-fit">
                  Severity: Critical
                </span>
                <h3 className="font-bold text-base text-white leading-snug">Pothole blocking dual lane</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-violet-400" />
                  <span>Outer Ring Road, Ward 12</span>
                </div>
              </div>
            </div>

            {/* AI Diagnostics Box */}
            <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300 font-mono">Gemini AI Audit</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                &ldquo;Action Brief: Repair pothole obstructing traffic. Location Detail: Ring Road crossing.&rdquo;
              </p>
              <div className="flex items-center justify-between text-[10px] text-violet-400 font-mono mt-1 pt-1.5 border-t border-violet-500/10">
                <span>Confidence: 94.2%</span>
                <span>Dup check: Clear radius (500m)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Dashboard Info */}
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

      {/* AI Capabilities Overview */}
      <section className="glass-card p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 blur-3xl -z-10" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-left">
          Primary AI Engine: <span className="text-violet-400">Gemini 1.5 Pro</span>
        </h2>
        <p className="text-gray-400 text-sm mt-1 text-left">
          Directly integrated with Google AI Studio API for civic analysis and predictions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <span className="font-mono text-xs text-violet-400 font-bold uppercase">Capability 1</span>
            <h4 className="font-bold text-white">Multimodal Vision</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Analyzes photos of potholes, waste, or streetlights to automatically categorize them and suggest severity tiers.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <span className="font-mono text-xs text-violet-400 font-bold uppercase">Capability 2</span>
            <h4 className="font-bold text-white">Text Embeddings</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Computes 768-dimension vectors using `text-embedding-004` to run similarity tests against issues in a 500m radius.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <span className="font-mono text-xs text-violet-400 font-bold uppercase">Capability 3</span>
            <h4 className="font-bold text-white">Structured Forecasts</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Analyzes historical issue streams to output JSON-formatted preventative work models for administration planning.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <span className="font-mono text-xs text-violet-400 font-bold uppercase">Capability 4</span>
            <h4 className="font-bold text-white">Sentiment Scoring</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Calculates a frustration index for open tickets and flags toxic comments in discussion queues.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white">Active Tickets in Your Area</h2>
          <Link href="/track" className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1">
            View Map
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleReports.map((report) => (
            <div key={report.id} className="glass-card p-5 flex flex-col gap-4 border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                  report.severity === 'critical' 
                    ? "bg-red-500/10 text-red-400 border-red-500/20" 
                    : report.severity === 'high' 
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                )}>
                  {report.severity}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                  report.status === 'resolved' 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-zinc-800 text-gray-400"
                )}>
                  {report.status}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white line-clamp-1">{report.title}</h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {report.location}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                <span className="text-xs text-gray-500">{report.category}</span>
                <span className="text-xs font-bold text-violet-400">▲ {report.upvotes} upvotes</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
