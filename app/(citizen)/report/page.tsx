'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { compressAndProcessImage, cn } from '@/lib/utils';
import {
  Camera, MapPin, Loader2, Cpu, AlertTriangle, CheckCircle,
  ArrowRight, ArrowLeft, Send, X
} from 'lucide-react';

const STEP_LABELS = ['Media', 'Location', 'Details', 'Confirm'];

export default function ReportPage() {
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const { location, error: locError, loading: locLoading, requestLocation } = useLocation();

  const [step, setStep] = useState(0);
  const [useFallbackMap, setUseFallbackMap] = useState(false);

  // Set global fallback handler
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps authentication failed. Falling back to Leaflet Map.");
      setUseFallbackMap(true);
    };
  }, []);

  // Step 1 — Media
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 2 — Location
  const [address, setAddress] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Step 3 — Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideSeverity, setOverrideSeverity] = useState('');

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; confidence: number } | null>(null);
  const [duplicateWarningInfo, setDuplicateWarningInfo] = useState<{ id: string; score: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill location from GPS
  useEffect(() => {
    if (location) {
      const newPos = { lat: location.latitude, lng: location.longitude };
      setMapPosition(newPos);
      setAddress(`Near ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      if (mapInstanceRef.current && markerRef.current) {
        if (typeof mapInstanceRef.current.setView === 'function') {
          mapInstanceRef.current.setView([newPos.lat, newPos.lng], 16);
          if (typeof markerRef.current.setLatLng === 'function') {
            markerRef.current.setLatLng([newPos.lat, newPos.lng]);
          }
        } else if (typeof mapInstanceRef.current.setCenter === 'function') {
          mapInstanceRef.current.setCenter(newPos);
          if (typeof markerRef.current.setPosition === 'function') {
            markerRef.current.setPosition(newPos);
          }
        }
      }
    }
  }, [location]);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Google Maps or Leaflet picker for Step 2
  useEffect(() => {
    if (step !== 1 || !mapRef.current) return;
    let timeoutId: NodeJS.Timeout;

    const initLeafletMap = () => {
      if (!mapRef.current) return;
      
      const L = (window as any).L;
      if (!L) return;

      // Clean up previous Leaflet map if it exists
      if (mapInstanceRef.current) {
        if (typeof mapInstanceRef.current.remove === 'function') {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {
            console.warn("Failed to remove previous Leaflet map instance:", e);
          }
        }
        mapInstanceRef.current = null;
      }
      
      mapRef.current.innerHTML = '';
      
      const pos = mapPosition || { lat: 28.6139, lng: 77.2090 };
      const map = L.map(mapRef.current, {
        center: [pos.lat, pos.lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false
      });
      mapInstanceRef.current = map;
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
      
      const marker = L.marker([pos.lat, pos.lng], {
        draggable: true
      }).addTo(map);
      markerRef.current = marker;
      
      marker.on('dragend', () => {
        const newLatLng = marker.getLatLng();
        const newPos = { lat: newLatLng.lat, lng: newLatLng.lng };
        setMapPosition(newPos);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              setAddress(data.display_name);
            } else {
              setAddress(`Near ${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`);
            }
          })
          .catch(() => {
            setAddress(`Near ${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`);
          });
      });
      
      map.on('click', (e: any) => {
        const newLatLng = e.latlng;
        marker.setLatLng(newLatLng);
        const newPos = { lat: newLatLng.lat, lng: newLatLng.lng };
        setMapPosition(newPos);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };

    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.crossOrigin = '';
        script.onload = () => {
          initLeafletMap();
        };
        document.head.appendChild(script);
      } else {
        if ((window as any).L) {
          initLeafletMap();
        } else {
          const existingScript = document.getElementById('leaflet-js');
          if (existingScript) {
            existingScript.addEventListener('load', () => {
              initLeafletMap();
            });
          }
        }
      }
    };

    if (useFallbackMap) {
      loadLeaflet();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'YOUR_MAPS_KEY') {
      setUseFallbackMap(true);
      return;
    }

    const initLocationMap = () => {
      if (!window.google?.maps || !mapRef.current) return;
      const pos = mapPosition || { lat: 28.6139, lng: 77.2090 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
          { featureType: 'water', stylers: [{ color: '#0f172a' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        ],
      });
      mapInstanceRef.current = map;

      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map,
        draggable: true,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#7c3aed', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      });

      markerRef.current.addListener('dragend', (e: any) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMapPosition(newPos);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPos }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      });

      map.addListener('click', (e: any) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        markerRef.current?.setPosition(newPos);
        setMapPosition(newPos);
      });
    };

    if (window.google?.maps) {
      initLocationMap();
    } else {
      // Set a 3-second timeout fallback to Leaflet
      timeoutId = setTimeout(() => {
        if (!window.google?.maps || !mapInstanceRef.current) {
          console.warn("Google Maps failed to load within timeout on report page. Falling back to Leaflet Map.");
          setUseFallbackMap(true);
        }
      }, 3000);

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__initLocationMap`;
      script.async = true;
      (window as any).__initLocationMap = () => {
        clearTimeout(timeoutId);
        initLocationMap();
      };
      document.head.appendChild(script);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      delete (window as any).__initLocationMap;
    };
  }, [step, useFallbackMap]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Enforce size limits
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Rejection: File size exceeds maximum limit of 50MB.');
      e.target.value = '';
      return;
    }

    if (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
      setErrorMsg('Rejection: Image exceeds maximum limit of 10MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAiPreview(null);
    setAiLoading(true);

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('description', description || 'Civic issue');
      const token = await getAuthToken();
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setAiPreview(data);
        if (data.suggestedTitle && !title) setTitle(data.suggestedTitle);
        setOverrideCategory(data.category);
        setOverrideSeverity(data.severity);
      }
    } catch (err) {
      console.error('AI preview failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!imageFile;
    if (step === 1) return !!mapPosition;
    if (step === 2) return title.trim().length > 3 && description.trim().length > 10;
    return true;
  };

  const handleSubmit = async (force = false) => {
    if (!imageFile || !mapPosition) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const compressed = await compressAndProcessImage(imageFile);
      const compressedFile = new File([compressed], 'report.webp', { type: 'image/webp' });

      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('latitude', mapPosition.lat.toString());
      fd.append('longitude', mapPosition.lng.toString());
      fd.append('address', address);
      fd.append('reportedBy', user?.id || 'anonymous');
      fd.append('overrideCategory', overrideCategory);
      fd.append('overrideSeverity', overrideSeverity);
      fd.append('image', compressedFile);
      if (force === true) {
        fd.append('duplicateOverride', 'true');
      }

      const token = await getAuthToken();
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const result = await res.json();

      if (res.status === 409 && result.duplicateWarning) {
        setDuplicateWarningInfo({ id: result.possibleDuplicateOf, score: result.duplicateScore });
        setStep(3); // Keep user on review step to confirm override
        return;
      }

      if (result.success) {
        setSubmitSuccess(true);
        setTrackingId(result.issueId || '');
        setDuplicateWarningInfo(null);
        if (result.aiMetadata?.possibleDuplicateOf) {
          setDuplicateInfo({ id: result.aiMetadata.possibleDuplicateOf, confidence: result.aiMetadata.duplicateScore || 0 });
        }
      } else {
        setErrorMsg(result.error || 'Submission failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ——— SUCCESS STATE ———
  if (submitSuccess) {
    return (
      <div className="max-w-md mx-auto py-10 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Report Filed!</h1>
          <p className="text-gray-400 text-sm mt-2">
            Your issue has been submitted and the community can now validate it.
          </p>
          {trackingId && (
            <div className="mt-3 px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl">
              <span className="text-xs text-gray-500">Tracking ID: </span>
              <span className="text-xs font-mono text-violet-400 font-bold">{trackingId.slice(0, 12).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="glass-card p-4 w-full border-amber-500/20">
          <p className="text-amber-400 font-bold text-sm">★ +10 Points Awarded</p>
          <p className="text-xs text-gray-400 mt-1">You earned 10 points for civic contribution!</p>
        </div>
        {duplicateInfo && (
          <div className="glass-card p-4 w-full border-yellow-500/20 bg-yellow-950/10">
            <p className="text-yellow-400 text-sm font-bold">⚠️ Possible Duplicate Detected</p>
            <p className="text-xs text-gray-400 mt-1">
              A similar issue ({(duplicateInfo.confidence * 100).toFixed(0)}% match) already exists. Consider upvoting that one instead.
            </p>
            <button onClick={() => router.push('/map')} className="text-xs text-violet-400 hover:underline mt-2 block">
              View on Map →
            </button>
          </div>
        )}
        <div className="flex gap-3 w-full">
          <button onClick={() => router.push('/map')} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
            View Map
          </button>
          <button onClick={() => { setSubmitSuccess(false); setStep(0); setImageFile(null); setImagePreview(null); setAiPreview(null); setTitle(''); setDescription(''); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white hover:opacity-90 transition-opacity">
            Report Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Report Civic Issue</h1>
        <p className="text-sm text-gray-400 mt-1">Gemini Vision will auto-categorize your report.</p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                i < step ? 'bg-violet-600 border-violet-600 text-white' :
                i === step ? 'bg-violet-600/20 border-violet-500 text-violet-400' :
                'bg-zinc-900 border-white/10 text-gray-500'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn('text-[10px] font-semibold', i === step ? 'text-violet-400' : 'text-gray-500')}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mb-5 transition-all', i < step ? 'bg-violet-600' : 'bg-white/5')} />
            )}
          </React.Fragment>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/15 text-sm text-red-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* ——— STEP 0: MEDIA ——— */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white">Upload Incident Photo</h2>
            <p className="text-xs text-gray-400">Gemini Vision will instantly analyze and categorize your image.</p>
          </div>

          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl py-16 cursor-pointer hover:border-violet-500/50 transition-colors bg-zinc-900/30 group">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-violet-400" />
              </div>
              <span className="text-sm font-bold text-gray-300">Capture Photo or Choose File</span>
              <span className="text-xs text-gray-500 mt-1">Auto-compressed to WebP ({'<'}500KB)</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setAiPreview(null); }}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 p-1.5 rounded-lg text-white"
              >
                <X className="w-4 h-4" />
              </button>
              {aiLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex items-center gap-2 bg-violet-950/80 px-4 py-2 rounded-full text-violet-300 text-sm font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gemini Vision scanning...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Preview */}
          {aiPreview && !aiLoading && (
            <div className="rounded-2xl border border-violet-500/25 bg-violet-950/10 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-violet-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-violet-400 font-mono">Gemini Vision Analysis</span>
                <div className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {(aiPreview.confidenceScore * 100).toFixed(0)}% confidence
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Category', value: aiPreview.category.toUpperCase() },
                  { label: 'Severity', value: aiPreview.severity.toUpperCase(), className: aiPreview.severity === 'critical' ? 'text-red-400' : aiPreview.severity === 'high' ? 'text-orange-400' : 'text-amber-400' },
                  { label: 'Safety Hazard', value: aiPreview.safetyHazard ? '⚠️ Yes' : 'None Detected' },
                  { label: 'AI Title', value: aiPreview.suggestedTitle?.slice(0, 40) || '—', className: 'text-xs' },
                ].map(({ label, value, className }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-500 uppercase font-mono">{label}</span>
                    <span className={cn('text-sm font-bold text-white', className)}>{value}</span>
                  </div>
                ))}
              </div>
              {aiPreview.actionBrief && (
                <div className="bg-zinc-950/60 border border-white/5 rounded-lg p-3 text-[11px] text-gray-300">
                  <span className="font-bold text-violet-400">Action Brief: </span>{aiPreview.actionBrief}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ——— STEP 1: LOCATION ——— */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white">Pin the Location</h2>
            <p className="text-xs text-gray-400">Drag the marker to exact location or use GPS.</p>
          </div>

          <div className="glass-card p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-bold text-white">GPS Coordinates</span>
              </div>
              <button
                onClick={requestLocation}
                disabled={locLoading}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 disabled:opacity-50 flex items-center gap-1"
              >
                {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Use Current Location
              </button>
            </div>

            {locError && <p className="text-xs text-amber-400">{locError}</p>}

            {/* Map picker */}
            <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 relative">
              {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-xl">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Map picker loads with NEXT_PUBLIC_GOOGLE_MAPS_KEY</p>
                  </div>
                </div>
              )}
            </div>

            {mapPosition && (
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>Lat: {mapPosition.lat.toFixed(6)}</span>
                <span>Lng: {mapPosition.lng.toFixed(6)}</span>
              </div>
            )}

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Confirm or type the street address..."
              className="w-full bg-zinc-950/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* ——— STEP 2: DETAILS ——— */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-white">Describe the Issue</h2>
            <p className="text-xs text-gray-400 mt-1">Review AI suggestions and add context.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief descriptive title..."
                className="w-full bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context — what is damaged? Is it blocking traffic? Any safety risk?"
                className="w-full bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Category</label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                >
                  {['pothole', 'streetlight', 'water', 'waste', 'encroachment', 'other'].map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Severity</label>
                <select
                  value={overrideSeverity}
                  onChange={(e) => setOverrideSeverity(e.target.value)}
                  className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                >
                  {['low', 'medium', 'high', 'critical'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ——— STEP 3: CONFIRM ——— */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-white">Review & Submit</h2>
            <p className="text-xs text-gray-400 mt-1">Confirm your report details before filing.</p>
          </div>

          <div className="glass-card p-5 flex flex-col gap-4 border-violet-500/15">
            {imagePreview && (
              <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Report photo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Title', value: title },
                { label: 'Category', value: overrideCategory.toUpperCase() },
                { label: 'Severity', value: overrideSeverity.toUpperCase() },
                { label: 'Location', value: address.slice(0, 50) || 'Unknown' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">{label}</span>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Description</span>
              <p className="text-sm text-gray-300">{description}</p>
            </div>
            {duplicateWarningInfo && (
              <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-4 flex flex-col gap-2 text-xs text-yellow-400">
                <p className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span> Possible Duplicate Detected ({(duplicateWarningInfo.score * 100).toFixed(0)}% match)
                </p>
                <p className="text-gray-400">
                  A similar issue was found nearby. You can view it and upvote/validate it to gain points, or force submit this new report if they are different.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
              <span>★</span>
              <span>You will earn <strong>+10 points</strong> upon successful submission.</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {step < STEP_LABELS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : duplicateWarningInfo ? (
          <div className="flex-1 flex gap-3">
            <button
              onClick={() => router.push(`/issues/${duplicateWarningInfo.id}`)}
              className="flex-1 py-3 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 text-sm font-bold text-yellow-400 hover:bg-yellow-500/5 transition-all"
            >
              View Existing
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Force Submit
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting || !imageFile || !mapPosition}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                File Report
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
