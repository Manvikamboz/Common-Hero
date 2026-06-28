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
import { useLanguage } from '@/context/LanguageContext';

declare global {
  interface Window { google: any; }
}

// Lucide-compatible inline SVG paths per category (viewBox="0 0 24 24")
const CATEGORY_SVG: Record<string, string> = {
  pothole:
    `<circle cx="12" cy="12" r="3"/><path d="M2 12h3M19 12h3M12 2v3M12 19v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>`,
  streetlight:
    `<path d="M12 2v8"/><circle cx="12" cy="14" r="4"/><path d="M8 22h8M12 18v4"/>`,
  water:
    `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"/><path d="M12 2c0 5-4 8-4 12a4 4 0 0 0 8 0c0-4-4-7-4-12z"/>`,
  waste:
    `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>`,
  encroachment:
    `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  other:
    `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
};

const CATEGORY_LABELS: Record<string, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  water: 'Water',
  waste: 'Waste',
  encroachment: 'Encroachment',
  other: 'Other',
};

// Helper: build a white SVG string for use inside Leaflet divIcon
function makeCategorySVG(category: string): string {
  const path = CATEGORY_SVG[category] || CATEGORY_SVG.other;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

export default function MapPage() {
  const { user, getAuthToken } = useAuth();
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [validationLoading, setValidationLoading] = useState<string | null>(null);
  const [useFallbackMap, setUseFallbackMap] = useState(false);


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

  const mapInitialized = useRef(false); // prevent double-init

  // ─── Map initialisation: fire once, but only when map view is visible ──────
  // We can't init on mount because the container is CSS-hidden until the user
  // is in 'map' mode — Leaflet measures 0×0 and tiles never load.
  useEffect(() => {
    // Only proceed when user is looking at the map tab and it's not yet inited
    if (viewMode !== 'map' || mapInitialized.current) return;

    // Wait one frame so the container is definitely in the layout
    const rafId = requestAnimationFrame(() => {
      if (!mapRef.current) return;

      mapInitialized.current = true;

      const initLeafletMap = (L: any) => {
        if (!mapRef.current) return;

        // Tear down any previous Leaflet instance
        if (googleMapRef.current) {
          try { googleMapRef.current.remove?.(); } catch (_) {}
          googleMapRef.current = null;
        }
        mapRef.current.innerHTML = '';

        const map = L.map(mapRef.current, {
          center: [28.6139, 77.2090],
          zoom: 12,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        googleMapRef.current = map;
        setUseFallbackMap(true);
        setMapLoaded(true);

        // Give the browser a moment to paint the tiles before invalidating
        setTimeout(() => map.invalidateSize(), 300);
      };

      const loadLeafletScript = () => {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id  = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const L = (window as any).L;
        if (L) { initLeafletMap(L); return; }

        const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => initLeafletMap((window as any).L), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.id  = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload  = () => initLeafletMap((window as any).L);
        script.onerror = () => console.error('Leaflet failed to load from unpkg.com');
        document.head.appendChild(script);
      };

      // Prefer Google Maps if SDK is already present; otherwise use Leaflet
      if (window.google?.maps?.Map) {
        try {
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 28.6139, lng: 77.2090 },
            zoom: 12,
            mapId: 'community_hero_map',
          });
          googleMapRef.current = map;
          infoWindowRef.current = new window.google.maps.InfoWindow();
          setMapLoaded(true);
        } catch (e) {
          console.warn('Google Maps init failed, falling back to Leaflet:', e);
          loadLeafletScript();
        }
      } else {
        loadLeafletScript();
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [viewMode]); // re-runs when user switches to map tab

  // Update markers when issues change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    if (useFallbackMap) {
      // Clear old markers safely
      markersRef.current.forEach((m) => {
        if (typeof m.remove === 'function') {
          m.remove();
        } else if (typeof m.setMap === 'function') {
          m.setMap(null);
        }
      });
      markersRef.current = [];

      const L = (window as any).L;
      if (!L) return;

      const newMarkers = issues.map((issue) => {
        const color = getMarkerColorByStatus(issue.status);
        const svgIcon = makeCategorySVG(issue.category);
        const label = CATEGORY_LABELS[issue.category] || issue.category;

        // Custom divIcon: SVG icon on a status-coloured circle badge
        const icon = L.divIcon({
          className: '',
          html: `
            <div title="${label.toUpperCase()} · ${issue.title}" style="
              width:36px;height:36px;
              background:${color};
              border:2px solid #fff;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);
              cursor:pointer;
            ">${svgIcon}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(
          [issue.location.latitude, issue.location.longitude],
          { icon }
        ).addTo(googleMapRef.current);

        // Tooltip: category label + issue title
        marker.bindTooltip(
          `<b>${label}</b><br/><span style="font-size:11px">${issue.title}</span>`,
          { direction: 'top', offset: [0, -20], opacity: 0.95 }
        );

        marker.on('click', () => {
          setSelectedIssue(issue);
          setPanelOpen(true);
        });

        return marker;
      });

      markersRef.current = newMarkers;
      return;
    }

    if (!window.google) return;

    // Clear old markers safely
    markersRef.current.forEach((m) => {
      if (typeof m.setMap === 'function') {
        m.setMap(null);
      } else if (typeof m.remove === 'function') {
        m.remove();
      }
    });
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const newMarkers = issues.map((issue) => {
      const color = getMarkerColorByStatus(issue.status);
      const label = CATEGORY_LABELS[issue.category] || issue.category;
      // Abbreviation for Google Maps label (max 2 chars to fit in circle)
      const abbr = label.slice(0, 2).toUpperCase();
      const marker = new window.google.maps.Marker({
        position: { lat: issue.location.latitude, lng: issue.location.longitude },
        map: googleMapRef.current,
        title: `${label.toUpperCase()} · ${issue.title}`,
        label: {
          text: abbr,
          color: '#fff',
          fontSize: '10px',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
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
        gradient: ['transparent', '#16a34a', '#86efac', '#eab308', '#ef4444'],
      });
    } else if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }
  }, [issues, mapLoaded, heatmapEnabled, useFallbackMap]);

  const handleValidate = async (issueId: string) => {
    if (!user) return;
    setValidationLoading(issueId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/issues/${issueId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('mapTitle')}</h1>
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
          {t('filterLabel')}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-zinc-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">{t('allStatuses')}</option>
          {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {(selectedCategory || selectedStatus) && (
          <button
            onClick={() => { setSelectedCategory(''); setSelectedStatus(''); }}
            className="text-xs text-violet-400 hover:underline"
          >
            {t('clear')}
          </button>
        )}

        {/* Legend — status + category */}
        <div className="ml-auto flex flex-col gap-1.5 text-[10px] font-semibold">
          {/* Status row */}
          <div className="flex items-center gap-2.5">
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
          {/* Category row */}
          <div className="flex items-center gap-3 text-gray-400">
            {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => (
              <div key={cat} className="flex items-center gap-1" title={catLabel}>
                <span
                  className="w-4 h-4 inline-block text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CATEGORY_SVG[cat]}</svg>`,
                  }}
                />
                <span className="hidden sm:inline">{catLabel}</span>
              </div>
            ))}
          </div>
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
          {t('heatmap')}
        </button>
      </div>

      {/* ── Map container — always in DOM so mapRef is never null ─────────── */}
      {/* Visibility toggled via CSS, not conditional render                  */}
      <div
        className="relative"
        style={{ display: (!loading && !error && viewMode === 'map') ? 'block' : 'none' }}
      >
        <div className="glass-card w-full h-[70vh] min-h-[500px] overflow-hidden relative border-white/10">
          {/* The real Leaflet/Google Maps target — always visible */}
          <div ref={mapRef} className="w-full h-full" />

          {/* Spinner overlay until map engine initialises */}
          {!mapLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f0f4f8] gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B3D91]" />
              <span className="text-sm font-medium text-[#1F2937]">{t('loadingMap')}</span>
            </div>
          )}

          {/* Issue count badge */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-[#0B3D91]/10 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B3D91] z-20">
            {issues.length} {t('incidents')}
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
                  {t('validate')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content (loading / error / list view) ───────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span>{t('loadingIncidents')}</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-400 bg-red-950/10 border border-red-500/20 rounded-xl">{error}</div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => { setSelectedIssue(issue); setPanelOpen(true); setViewMode('map'); }}
              className="glass-card p-5 flex flex-col gap-3 border-white/5 hover:border-violet-500/25 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-5 h-5 text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CATEGORY_SVG[issue.category] || CATEGORY_SVG.other}</svg>`,
                  }}
                />
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
      ) : null}
    </div>
  );
}
