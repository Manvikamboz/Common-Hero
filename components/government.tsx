'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  AlertTriangle, 
  X, 
  Megaphone, 
  FileText, 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldAlert,
  Flame,
  Droplet,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// 1. EMERGENCY ANNOUNCEMENTS BANNER
// ==========================================
interface EmergencyHazard {
  id: string;
  title: string;
  category: string;
  severity: string;
  location: {
    address: string;
  };
}

export function EmergencyBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [hasEmergency, setHasEmergency] = useState(false);
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null);
  const [hazards, setHazards] = useState<EmergencyHazard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmergencyData = async (lat: number, lng: number) => {
      try {
        // 1. Fetch weather warning
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code,wind_speed_10m,precipitation`;
        const weatherRes = await fetch(weatherUrl);
        let weatherCode = 0;
        let windSpeed = 0;
        let precipitation = 0;
        let warningText = "";

        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const current = weatherData.current;
          weatherCode = current?.weather_code || 0;
          windSpeed = current?.wind_speed_10m || 0;
          precipitation = current?.precipitation || 0;
        }

        // Map weather code to emergency alerts
        if (weatherCode >= 95) {
          warningText = "Severe Thunderstorm Warning: Threat of lightning and heavy winds. Seek shelter.";
        } else if (weatherCode >= 80) {
          warningText = "Heavy Rain Showers Alert: Low visibility and potential flash flooding.";
        } else if (weatherCode >= 61) {
          warningText = "Heavy Rainfall Advisory: Waterlogging expected on major streets.";
        } else if (weatherCode >= 51) {
          warningText = "Light Rain / Drizzle Alert: Roadways may be slick and slippery.";
        } else if (windSpeed > 20) {
          warningText = "High Wind Warning: Expect minor structural damage and falling branches.";
        }

        // 2. Fetch active hazard reports (potholes, electric wires, construction areas)
        const issuesRes = await fetch('/api/issues');
        let emergencyHazards: EmergencyHazard[] = [];
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          if (issuesData.success && Array.isArray(issuesData.issues)) {
            emergencyHazards = issuesData.issues.filter((issue: any) => {
              if (issue.status === 'resolved' || issue.status === 'archived') return false;

              const title = issue.title.toLowerCase();
              const desc = issue.description.toLowerCase();
              const cat = issue.category.toLowerCase();

              const isWire = title.includes('wire') || title.includes('electric') || title.includes('cable') || title.includes('short circuit') || desc.includes('wire') || desc.includes('electric') || desc.includes('cable');
              const isPothole = cat === 'pothole' || title.includes('pothole') || desc.includes('pothole');
              const isConstruction = title.includes('construction') || title.includes('digging') || title.includes('road work') || title.includes('excavation') || desc.includes('construction') || desc.includes('digging') || desc.includes('road work');

              return isWire || isPothole || isConstruction;
            });
          }
        }

        // Determine if emergency is active (weather hazard OR active severe civic hazards exist)
        const activeEmergency = !!warningText || emergencyHazards.some(h => h.severity === 'critical' || h.severity === 'high');
        
        setWeatherWarning(warningText || (emergencyHazards.length > 0 ? "Civic Hazard Warning: High-risk areas detected in your vicinity." : null));
        setHazards(emergencyHazards);
        setHasEmergency(activeEmergency);
      } catch (err) {
        console.error('Failed to load emergency data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchEmergencyData(pos.coords.latitude, pos.coords.longitude),
        () => fetchEmergencyData(28.6139, 77.2090)
      );
    } else {
      fetchEmergencyData(28.6139, 77.2090);
    }
  }, []);

  if (dismissed || loading || !hasEmergency) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-700 to-rose-600 text-white p-4 shadow-xl z-40 relative md:rounded-xl md:mb-6 animate-fade-in border border-red-500/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-red-900/60 p-2 rounded-lg shrink-0 mt-0.5 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider bg-red-950/80 px-2.5 py-0.5 rounded text-[10px] uppercase border border-red-800">
                {t('emergencyActive') || 'EMERGENCY ACTIVE'}
              </span>
            </div>
            <p className="text-sm font-semibold mt-1.5 leading-snug">
              {weatherWarning}
            </p>

            {/* List Hazard locations */}
            {hazards.length > 0 && (
              <div className="mt-3 bg-red-950/40 border border-red-800/40 rounded-lg p-3">
                <span className="text-[11px] font-extrabold text-yellow-300 uppercase tracking-wider">
                  ⚠️ High-Risk Incident Zones (Avoid/Exercise Caution):
                </span>
                <ul className="mt-2 space-y-1.5">
                  {hazards.slice(0, 4).map((hazard) => (
                    <li key={hazard.id} className="text-xs flex items-start gap-1.5 text-red-100 font-medium">
                      <span className="text-yellow-400 mt-0.5 shrink-0">📍</span>
                      <div>
                        <span className="font-bold text-white capitalize">{hazard.category}:</span>{' '}
                        {hazard.title} — <span className="text-red-200 italic">{hazard.location.address}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
          aria-label="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 2. NOTICE BOARD COMPONENT
// ==========================================
export function NoticeBoard() {
  const { t } = useLanguage();

  const notices = [
    { title: t('notice1Title'), date: t('notice1Date'), desc: t('notice1Desc') },
    { title: t('notice2Title'), date: t('notice2Date'), desc: t('notice2Desc') },
    { title: t('notice3Title'), date: t('notice3Date'), desc: t('notice3Desc') },
  ];

  return (
    <section className="glass-card p-6 flex flex-col gap-6 text-left w-full">
      <div className="flex items-center gap-3 border-b border-zinc-200/60 pb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{t('noticeTitle')}</h2>
          <p className="text-xs text-zinc-500">{t('noticeSub')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {notices.map((notice, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-lg bg-zinc-50 hover:bg-blue-50/20 border border-zinc-200/50 hover:border-blue-200/50 transition-all duration-200 group flex items-start gap-3.5 text-left"
          >
            <div className="w-8 h-8 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0 shadow-sm">
              <FileText className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-bold text-sm text-zinc-800 group-hover:text-blue-700 transition-colors truncate">
                  {notice.title}
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                  {notice.date}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                {notice.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 3. EMERGENCY HELPLINE DIRECTORY
// ==========================================
export function HelplineDirectory() {
  const { t } = useLanguage();

  const helplines = [
    { name: t('helpDisaster'), number: '108', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { name: t('helpAmbulance'), number: '102', icon: PhoneCall, color: 'text-red-500', bg: 'bg-red-50/50', border: 'border-red-100/60' },
    { name: t('helpFire'), number: '101', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { name: t('helpPolice'), number: '100', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: t('helpWater'), number: '1916', icon: Droplet, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    { name: t('helpPower'), number: '1912', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  ];

  return (
    <section className="glass-card p-6 flex flex-col gap-6 text-left w-full">
      <div className="flex items-center gap-3 border-b border-zinc-200/60 pb-4">
        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{t('helplineTitle')}</h2>
          <p className="text-xs text-zinc-500">{t('helplineSub')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {helplines.map((item, idx) => {
          const Icon = item.icon;
          return (
            <a 
              key={idx} 
              href={`tel:${item.number}`}
              className={cn(
                "p-4 rounded-xl border flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm",
                item.bg, item.border
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                <Icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-700 truncate">{item.name}</p>
                <p className={cn("text-base font-extrabold font-mono mt-0.5", item.color)}>
                  {item.number}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// 4. FOOTER WITH GOVERNMENT CONTACTS
// ==========================================
export function GovernmentFooter() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-zinc-900 text-zinc-400 mt-20 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
        {/* About Government Agency */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-extrabold text-base tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            {t('footerGovTitle')}
          </h3>
          <p className="text-xs leading-relaxed text-zinc-400 max-w-sm">
            {t('footerGovSub')} Dedicated to transparent civic governance and citizen empowerment.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">{t('footerQuickLinks')}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a href="/" className="hover:text-white transition-colors">{t('home')}</a>
            <a href="/report" className="hover:text-white transition-colors">{t('report')}</a>
            <a href="/map" className="hover:text-white transition-colors">{t('map')}</a>
            <a href="/leaderboard" className="hover:text-white transition-colors">{t('leaderboard')}</a>
          </div>
        </div>

        {/* Contact Info Desk */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">{t('footerHelpline')}</h4>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-start gap-2">
              <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="font-extrabold text-zinc-200">{t('footerHelplineNo')}</p>
                <p className="text-[10px] text-zinc-500">Toll-Free 24x7</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="hover:text-white transition-colors">{t('footerEmail')}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="leading-snug">{t('footerAddress')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="w-full bg-zinc-950 py-5 px-6 border-t border-zinc-900 text-center text-[10px] text-zinc-500">
        {t('copyright')}
      </div>
    </footer>
  );
}
