'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getSeverityClasses, getStatusClasses, cn } from '@/lib/utils';
import { getMarkerColorByStatus } from '@/lib/maps';
import {
  MapPin, Filter, List, Map as MapIcon, X, ThumbsUp,
  Loader2, Layers
} from 'lucide-react';
import type { Issue } from '@/types';

declare global {
  interface Window { google: any; }
}

const CATEGORY_ICONS: Record<string, string> = {
  pothole: '🕳️', streetlight: '💡', water: '💧',
  waste: '🗑️', encroachment: '🚧', other: '📍',
};

export default function MapPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [validationLoading, setValidationLoading] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const heatmapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);

  const { issues, loading, error } = useIssues({
    status: selectedStatus || undefined,
    category: selectedCategory || undefined,
  });

  const initMap = useCallback(async () => {
    if (!mapRef.current || !window.google) return;

    const { Map } = window.google.maps;
    const map = new Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.2090 },
      zoom: 12,
      mapId: 'community_hero_map',
      disableDefaultUI: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    googleMapRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
    setMapLoaded(true);
  }, []);

  // Load Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'YOUR_MAPS_KEY') {
      setMapLoaded(false);
      return;
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,marker&callback=__initGoogleMap`;
    script.async = true;
    (window as any).__initGoogleMap = initMap;
    document.head.appendChild(script);

    return () => {
      delete (window as any).__initGoogleMap;
    };
  }, [initMap]);

  // Update markers when issues change
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const newMarkers = issues.map((issue) => {
      const color = getMarkerColorByStatus(issue.status);
      const marker = new window.google.maps.Marker({
        position: { lat: issue.location.latitude, lng: issue.location.longitude },
        map: googleMapRef.current,
        title: issue.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        setSelectedIssue(issue);
        setPanelOpen(true);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Heatmap layer
    if (heatmapEnabled && window.google.maps.visualization) {
      if (heatmapRef.current) heatmapRef.current.setMap(null);
      const points = issues.map((iss) => new window.google.maps.LatLng(iss.location.latitude, iss.location.longitude));
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: points,
        map: googleMapRef.current,
        radius: 30,
        gradient: ['transparent', '#7c3aed', '#a855f7', '#ec4899', '#ef4444'],
      });
    } else if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }
  }, [issues, mapLoaded, heatmapEnabled]);

  const handleValidate = async (issueId: string) => {
    if (!user) return;
    setValidationLoading(issueId);
    try {
      const res = await fetch(`/api/issues/${issueId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userRole: user.role, status: 'valid', comments: 'Upvoted from map view' }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Validation failed');
      }
    } catch {
      alert('Request failed');
    } finally {
      setValidationLoading(null);
    }
  };

  const categories = ['pothole', 'streetlight', 'water', 'waste', 'encroachment', 'other'];
  const statuses = ['open', 'validated', 'assigned', 'in_progress', 'resolved'];
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const hasMapsKey = mapsApiKey && mapsApiKey !== 'YOUR_MAPS_KEY' && mapsApiKey !== '';

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Live Issue Map</h1>
          <p className="text-sm text-gray-400 mt-1">
            {issues.length} active incidents · Color coded by status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-xl">
            {[
              { mode: 'map', icon: MapIcon, label: 'Map' },
              { mode: 'list', icon: List, label: 'List' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  viewMode === mode ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3 flex flex-wrap items-center gap-3 border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <Filter className="w-3.5 h-3.5 text-violet-400" />
          Filter:
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {(selectedCategory || selectedStatus) && (
          <button
            onClick={() => { setSelectedCategory(''); setSelectedStatus(''); }}
            className="text-xs text-violet-400 hover:underline"
          >
            Clear
          </button>
        )}

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] font-semibold">
          {[
            { color: '#ef4444', label: 'Open' },
            { color: '#8b5cf6', label: 'Validated' },
            { color: '#f97316', label: 'Assigned' },
            { color: '#10b981', label: 'Resolved' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1 text-gray-400">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap toggle */}
        <button
          onClick={() => setHeatmapEnabled(!heatmapEnabled)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors',
            heatmapEnabled
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-zinc-800 border-white/10 text-gray-400 hover:text-white'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Heatmap
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span>Loading incidents...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-400 bg-red-950/10 border border-red-500/20 rounded-xl">{error}</div>
      ) : viewMode === 'map' ? (
        <div className="relative">
          {/* Map Container */}
          <div className="glass-card w-full h-[70vh] min-h-[500px] overflow-hidden relative border-white/10">
            {hasMapsKey ? (
              <div ref={mapRef} className="w-full h-full" />
            ) : (
              /* Demo Map Fallback */
              <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(139,92,246,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.3)_1px,transparent_1px)] bg-[size:40px_40px]" />
                {/* Mock Issue Pins */}
                {issues.map((issue, i) => {
                  const positions = [
                    { top: '25%', left: '30%' }, { top: '55%', left: '60%' }, { top: '35%', left: '70%' },
                    { top: '70%', left: '25%' }, { top: '45%', left: '45%' },
                  ];
                  const pos = positions[i % positions.length];
                  const color = getMarkerColorByStatus(issue.status);
                  return (
                    <button
                      key={issue.id}
                      onClick={() => { setSelectedIssue(issue); setPanelOpen(true); }}
                      style={{ position: 'absolute', ...pos }}
                      className="group flex flex-col items-center gap-1 z-10 hover:z-20 transition-all"
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center text-sm shadow-lg transition-transform group-hover:scale-125"
                        style={{ background: color }}
                      >
                        {CATEGORY_ICONS[issue.category]}
                      </div>
                      <div className="hidden group-hover:block absolute top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl max-w-[140px] truncate">
                        {issue.title}
                      </div>
                    </button>
                  );
                })}
                <div className="z-10 text-center flex flex-col items-center gap-2 p-4 max-w-xs">
                  <MapIcon className="w-10 h-10 text-violet-500/60" />
                  <p className="text-xs text-gray-500">
                    Interactive Google Maps loads with <code className="text-violet-400">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>
                  </p>
                </div>
              </div>
            )}

            {/* Issue count badge */}
            <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white">
              {issues.length} Incidents
            </div>
          </div>

          {/* Slide-up Issue Panel */}
          {panelOpen && selectedIssue && (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:absolute md:bottom-4 md:left-4 md:right-4 md:max-w-md">
              <div className="glass-card p-5 flex flex-col gap-4 border-white/15 shadow-2xl animate-in slide-in-from-bottom-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border', getSeverityClasses(selectedIssue.severity))}>
                        {selectedIssue.severity}
                      </span>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase', getStatusClasses(selectedIssue.status))}>
                        {selectedIssue.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base leading-snug mt-1">{selectedIssue.title}</h3>
                  </div>
                  <button onClick={() => setPanelOpen(false)} className="text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2">{selectedIssue.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-violet-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{selectedIssue.location.address}</span>
                </div>

                {selectedIssue.aiMetadata?.autoSummary && (
                  <div className="bg-violet-950/20 border border-violet-500/20 rounded-lg p-2.5 text-[11px] text-violet-200">
                    <span className="font-bold text-violet-400">AI: </span>{selectedIssue.aiMetadata.autoSummary}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-500">{formatDate(selectedIssue.createdAt, true)} · {selectedIssue.upvotes} upvotes</span>
                  <button
                    onClick={() => handleValidate(selectedIssue.id)}
                    disabled={validationLoading === selectedIssue.id || selectedIssue.status === 'resolved'}
                    className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 disabled:opacity-40 border border-violet-500/30 text-violet-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    {validationLoading === selectedIssue.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-3.5 h-3.5" />
                    )}
                    Validate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => { setSelectedIssue(issue); setPanelOpen(true); setViewMode('map'); }}
              className="glass-card p-5 flex flex-col gap-3 border-white/5 hover:border-violet-500/25 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{CATEGORY_ICONS[issue.category]}</span>
                <span className={cn('px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border', getSeverityClasses(issue.severity))}>
                  {issue.severity}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm line-clamp-2">{issue.title}</h3>
                <div className="flex items-center gap-1 text-xs text-violet-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{issue.location.address}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className={cn('px-2 py-0.5 rounded-full font-bold text-[9px] uppercase', getStatusClasses(issue.status))}>
                  {issue.status}
                </span>
                <span>{issue.upvotes} ▲ · {formatDate(issue.createdAt, true)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
