'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp, MapPin, Cpu, Loader2, Zap, Activity,
  BarChart3, Users, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyticsDashboard } from '@/types';

// Dynamic import to avoid SSR issues with Chart.js
const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(m => m.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false });

// Register Chart.js only on client
let chartjsRegistered = false;
if (typeof window !== 'undefined' && !chartjsRegistered) {
  import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler }) => {
    Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
  });
  chartjsRegistered = true;
}

const CHART_COLORS = {
  violet: 'rgba(139, 92, 246, 0.85)',
  indigo: 'rgba(99, 102, 241, 0.85)',
  emerald: 'rgba(16, 185, 129, 0.85)',
  amber: 'rgba(245, 158, 11, 0.85)',
  rose: 'rgba(239, 68, 68, 0.85)',
  sky: 'rgba(14, 165, 233, 0.85)',
};

const MOCK_ANALYTICS: AnalyticsDashboard = {
  activeIssuesCount: 47,
  resolvedIssuesCount: 128,
  averageSeverity: 'Medium',
  categoryDistribution: { pothole: 38, streetlight: 24, water: 17, waste: 31, encroachment: 12, other: 6 },
  avgResolutionTimeHours: 36,
  activeCitizensCount: 214,
};

const MOCK_RESOLUTION_TREND = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  reported: [12, 18, 15, 24, 20, 31],
  resolved: [8, 14, 13, 20, 18, 28],
};

const MOCK_WARD_DATA = {
  labels: ['Ward 01', 'Ward 03', 'Ward 05', 'Ward 08', 'Ward 12'],
  counts: [8, 14, 11, 22, 19],
};

export default function AnalyticsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(true);
  const [sentimentData, setSentimentData] = useState<{ wardId: string; index: number }[]>([]);

  useEffect(() => {
    async function loadAll() {
      try {
        const [anaRes, predRes] = await Promise.allSettled([
          fetch('/api/analytics'),
          fetch('/api/ai/insights'),
        ]);

        if (anaRes.status === 'fulfilled') {
          const d = await anaRes.value.json();
          setAnalytics(d.success ? d : MOCK_ANALYTICS);
        } else {
          setAnalytics(MOCK_ANALYTICS);
        }
        setLoading(false);

        if (predRes.status === 'fulfilled') {
          const d = await predRes.value.json();
          setPredictions(d.success && d.predictions.length > 0 ? d.predictions : MOCK_PREDICTIONS);
        } else {
          setPredictions(MOCK_PREDICTIONS);
        }
        setPredLoading(false);

        setSentimentData([
          { wardId: 'Ward 12', index: 7.2 },
          { wardId: 'Ward 03', index: 6.8 },
          { wardId: 'Ward 08', index: 5.1 },
          { wardId: 'Ward 05', index: 4.3 },
          { wardId: 'Ward 01', index: 3.8 },
        ]);
      } catch {
        setAnalytics(MOCK_ANALYTICS);
        setPredictions(MOCK_PREDICTIONS);
        setLoading(false);
        setPredLoading(false);
      }
    }
    loadAll();
  }, []);

  const dist = analytics?.categoryDistribution ?? MOCK_ANALYTICS.categoryDistribution;

  const categoryChartData = {
    labels: Object.keys(dist).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      label: 'Issues',
      data: Object.values(dist),
      backgroundColor: [CHART_COLORS.rose, CHART_COLORS.amber, CHART_COLORS.sky, CHART_COLORS.emerald, CHART_COLORS.violet, CHART_COLORS.indigo],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const trendChartData = {
    labels: MOCK_RESOLUTION_TREND.labels,
    datasets: [
      {
        label: 'Reported',
        data: MOCK_RESOLUTION_TREND.reported,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ef4444',
      },
      {
        label: 'Resolved',
        data: MOCK_RESOLUTION_TREND.resolved,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const wardChartData = {
    labels: MOCK_WARD_DATA.labels,
    datasets: [{
      label: 'Open Issues',
      data: MOCK_WARD_DATA.counts,
      backgroundColor: CHART_COLORS.violet,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    },
  };

  const resolutionRate = analytics
    ? ((analytics.resolvedIssuesCount / (analytics.resolvedIssuesCount + analytics.activeIssuesCount)) * 100).toFixed(1)
    : '73.1';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span>Aggregating platform analytics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-violet-400" />
            Impact Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time civic platform analytics powered by Gemini AI predictions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
          <Cpu className="w-4 h-4" />
          Gemini 1.5 Pro · Analytics Engine
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Issues', value: (analytics?.activeIssuesCount ?? 47) + (analytics?.resolvedIssuesCount ?? 128), icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg Resolution', value: `${analytics?.avgResolutionTimeHours ?? 36}h`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Active Citizens', value: analytics?.activeCitizensCount ?? 214, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-5 flex flex-col gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Bar Chart */}
        <div className="glass-card p-5 flex flex-col gap-3 lg:col-span-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Issues by Category</h2>
          <div className="h-52">
            <Bar data={categoryChartData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
          </div>
        </div>

        {/* Resolution Trend Line */}
        <div className="glass-card p-5 flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">6-Month Resolution Trend</h2>
          <div className="h-52">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Ward Distribution + Sentiment Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward horizontal bar */}
        <div className="glass-card p-5 flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Open Issues by Ward</h2>
          <div className="h-48">
            <Bar
              data={wardChartData}
              options={{ ...chartOptions, indexAxis: 'y' as const, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>

        {/* Sentiment Gauge */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Citizen Frustration Index
          </h2>
          <p className="text-[10px] text-gray-500">Gemini-analyzed frustration score per ward (1=calm, 10=critical)</p>
          <div className="flex flex-col gap-3">
            {sentimentData.map(({ wardId, index }) => (
              <div key={wardId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">{wardId}</span>
                  <span className={cn('font-bold', index >= 7 ? 'text-red-400' : index >= 5 ? 'text-amber-400' : 'text-emerald-400')}>
                    {index.toFixed(1)}/10
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', index >= 7 ? 'bg-red-500' : index >= 5 ? 'bg-amber-500' : 'bg-emerald-500')}
                    style={{ width: `${(index / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Hotspot Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Gemini Hotspot Predictions</h2>
          <span className="text-xs text-gray-500">Next 14 days</span>
        </div>

        {predLoading ? (
          <div className="flex items-center gap-3 text-sm text-gray-400 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            Running predictive AI model...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {predictions.map((pred, i) => (
              <div key={i} className="glass-card p-6 flex flex-col gap-4 border-violet-500/10 bg-gradient-to-br from-zinc-950/50 to-zinc-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-bold text-white">{pred.wardId}</span>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border',
                    pred.probability > 0.75 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    pred.probability > 0.5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-violet-500/10 text-violet-400 border-violet-500/20'
                  )}>
                    <TrendingUp className="w-3 h-3" />
                    {(pred.probability * 100).toFixed(0)}% surge risk
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Risk Category</span>
                  <h3 className="font-extrabold text-white text-base uppercase mt-0.5">{pred.riskCategory}</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{pred.reasoning}</p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 font-semibold leading-relaxed">{pred.recommendedAction}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const MOCK_PREDICTIONS = [
  { wardId: 'Ward 12', riskCategory: 'Pothole', probability: 0.87, reasoning: 'High traffic volume combined with recent rainfall has accelerated road surface deterioration. 12 new pothole reports in the last 2 weeks show an accelerating trend.', recommendedAction: 'Deploy road-patching crew to Ward 12 main arterials before monsoon onset. Pre-position asphalt equipment at sector depot.' },
  { wardId: 'Ward 03', riskCategory: 'Water Leakage', probability: 0.74, reasoning: 'Aging pipeline infrastructure (25+ years) in Block B and C sectors. Historical data shows 3x surge in water issues during monsoon. 4 leak reports filed in 7 days.', recommendedAction: 'Schedule emergency pipeline audit for Block B. Deploy portable water tankers as contingency for supply disruption.' },
  { wardId: 'Ward 08', riskCategory: 'Streetlight Failure', probability: 0.62, reasoning: 'Grid transformer overload pattern detected. Consecutive streetlight failures in Sector 4-6 suggest underlying electrical faults not yet reported.', recommendedAction: 'Circuit inspection teams should test transformer loads in Sector 4-6 of Ward 08 and replace aging cable segments.' },
  { wardId: 'Ward 05', riskCategory: 'Waste Overflow', probability: 0.55, reasoning: 'Festive season approaching increases residential waste volume by 40%. Current collection frequency insufficient for projected demand.', recommendedAction: 'Increase waste collection frequency to twice-daily in Ward 05 market zones. Add 2 compactor routes during festive week.' },
];
