'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Trophy, Star, ShieldCheck, Camera, MapPin, Clock, CheckCircle,
  AlertTriangle, Loader2, ArrowRight, Medal, Flame, TrendingUp,
  FileText, BarChart3, User, Edit, Sparkles, X, ChevronRight, ChevronLeft, UserCheck, Calendar, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Badge {
  id: string;
  name: string;
  description: string;
  awardedAt: string;
}

interface IssueItem {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  upvotes: number;
  createdAt: string;
  location?: { address: string };
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    role: string;
    points: number;
    issuesReported: number;
    issuesValidated: number;
    issuesResolved?: number;
    badges: Badge[];
    wardId?: string;
    createdAt: string;
    age?: number;
    gender?: string;
    dob?: string;
    town?: string;
    state?: string;
    district?: string;
    address?: string;
    phone?: string;
  };
  issues: IssueItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const STATUS_STYLE: Record<string, string> = {
  resolved: 'bg-emerald-500/10 text-emerald-400',
  validated: 'bg-sky-500/10 text-sky-400',
  open: 'bg-violet-500/10 text-violet-400',
  in_progress: 'bg-amber-500/10 text-amber-400',
  archived: 'bg-zinc-700 text-gray-500',
};

const BADGE_COLORS: Record<string, string> = {
  first_report: 'from-amber-500 to-orange-500',
  neighborhood_watch: 'from-blue-500 to-sky-500',
  validator_pro: 'from-emerald-500 to-teal-500',
  impact_maker: 'from-violet-500 to-purple-500',
  streak_hero: 'from-rose-500 to-pink-500',
  community_pillar: 'from-indigo-500 to-blue-500',
  top_contributor: 'from-yellow-500 to-amber-500',
  data_driven: 'from-cyan-500 to-sky-500',
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_report: <Star className="w-5 h-5" />,
  neighborhood_watch: <ShieldCheck className="w-5 h-5" />,
  validator_pro: <CheckCircle className="w-5 h-5" />,
  impact_maker: <Flame className="w-5 h-5" />,
  streak_hero: <TrendingUp className="w-5 h-5" />,
  community_pillar: <Trophy className="w-5 h-5" />,
  top_contributor: <Medal className="w-5 h-5" />,
  data_driven: <BarChart3 className="w-5 h-5" />,
};

function getUserInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getAvatarPath(age: number, gender: string): string {
  const g = gender.toLowerCase();
  const isFemale = g === 'female' || g === 'woman' || g === 'women';
  const isMale = g === 'male' || g === 'man' || g === 'men';

  if (isFemale || (!isMale && age % 2 === 0)) {
    if (age <= 25) return '/Citizen Avatar/20 women citizen.png';
    if (age <= 35) return '/Citizen Avatar/30 women citizen.png';
    if (age <= 45) return '/Citizen Avatar/40 women citizen.png';
    if (age <= 57) return '/Citizen Avatar/50 women citizen.png';
    return '/Citizen Avatar/65 women citizen.png';
  } else {
    if (age <= 25) return '/Citizen Avatar/20 men citizen.png';
    if (age <= 35) return '/Citizen Avatar/30 men citizen.png';
    if (age <= 45) return '/Citizen Avatar/40 men citizen.png';
    if (age <= 62) return '/Citizen Avatar/50 men citizen.png';
    return '/Citizen Avatar/75 men citizen.png';
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, getAuthToken } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'badges'>('reports');

  // Onboarding / Edit Profile states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTown, setFormTown] = useState('');
  const [formStateVal, setFormStateVal] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        const res = await fetch(`/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProfile(data);
            return;
          }
        }
        setError('Failed to load profile data.');
      } catch (err: any) {
        setError(err.message || 'Error loading profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, getAuthToken]);

  useEffect(() => {
    if (profile) {
      setFormName(profile.user.name || '');
      setFormEmail(profile.user.email || '');
      setFormDob(profile.user.dob || '');
      setFormGender(profile.user.gender || '');
      setFormAddress(profile.user.address || '');
      setFormTown(profile.user.town || '');
      setFormStateVal(profile.user.state || '');
      setFormDistrict(profile.user.district || '');
      setFormPhone(profile.user.phone || '');
      setFormPhotoUrl(profile.user.photoUrl || '');
    }
  }, [profile]);

  const handleNextStep = () => {
    setOnboardingError(null);
    if (currentStep === 1 && !formName.trim()) {
      setOnboardingError('Name is required.');
      return;
    }
    if (currentStep === 2 && (!formEmail.trim() || !formEmail.includes('@'))) {
      setOnboardingError('Please enter a valid email address.');
      return;
    }
    if (currentStep === 3 && !formDob) {
      setOnboardingError('Please enter your Date of Birth.');
      return;
    }
    if (currentStep === 4 && !formGender) {
      setOnboardingError('Please select your gender.');
      return;
    }
    if (currentStep === 5 && !formAddress.trim()) {
      setOnboardingError('Please enter your residential address.');
      return;
    }
    if (currentStep === 6 && !formTown.trim()) {
      setOnboardingError('Please enter your ward, village or locality.');
      return;
    }
    if (currentStep === 7 && (!formStateVal.trim() || !formDistrict.trim())) {
      setOnboardingError('Please enter both State and District.');
      return;
    }
    if (currentStep === 8 && (!formPhone.trim() || formPhone.trim().length < 8)) {
      setOnboardingError('Please enter a valid contact number.');
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setOnboardingError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleOnboardingSubmit = async () => {
    setOnboardingError(null);
    if (!formName.trim()) {
      setOnboardingError('Name is required.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setOnboardingError('Please enter a valid email address.');
      return;
    }
    if (!formDob) {
      setOnboardingError('Please enter your Date of Birth.');
      return;
    }
    if (!formGender) {
      setOnboardingError('Please select your gender.');
      return;
    }
    if (!formAddress.trim()) {
      setOnboardingError('Please enter your residential address.');
      return;
    }
    if (!formTown.trim()) {
      setOnboardingError('Please enter your ward, village or locality.');
      return;
    }
    if (!formStateVal.trim() || !formDistrict.trim()) {
      setOnboardingError('Please enter both State and District.');
      return;
    }
    if (!formPhone.trim() || formPhone.trim().length < 8) {
      setOnboardingError('Please enter a valid contact number.');
      return;
    }

    setSubmittingOnboarding(true);
    try {
      const token = await getAuthToken();
      if (!user) return;

      // Calculate age from dob
      let calculatedAge = 0;
      if (formDob) {
        const birthDate = new Date(formDob);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      const avatarPath = formPhotoUrl || getAvatarPath(calculatedAge, formGender);

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          dob: formDob,
          gender: formGender,
          age: calculatedAge,
          address: formAddress,
          town: formTown,
          state: formStateVal,
          district: formDistrict,
          phone: formPhone,
          photoUrl: avatarPath,
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setShowOnboarding(false);
          // Reload page to reflect changes
          window.location.reload();
          return;
        }
      }
      
      const data = await res.json();
      setOnboardingError(data.error || 'Failed to update profile.');
    } catch {
      setOnboardingError('Network error updating profile.');
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  // ── Loading state ──
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <p className="text-gray-400 text-sm">{t('loadingProfile')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm text-white hover:bg-zinc-700 transition-colors">
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!user || !profile) return null;

  const { user: profileUser, issues } = profile;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const openCount = issues.filter((i) => ['open', 'validated', 'in_progress'].includes(i.status)).length;

  const isProfileIncomplete = !profileUser.name || !profileUser.email || !profileUser.dob || !profileUser.gender || !profileUser.address || !profileUser.town || !profileUser.state || !profileUser.district || !profileUser.phone;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 py-6">

      {/* Onboarding Alert Banner */}
      {isProfileIncomplete && (
        <div className="glass-card p-4 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-xl text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-white text-sm">{t('completeOnboarding')}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{t('completeOnboardingSub')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentStep(1);
              setShowOnboarding(true);
            }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-violet-500/20 whitespace-nowrap"
          >
            {t('completeSetup')}
          </button>
        </div>
      )}

      {/* ── Hero Card ── */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/5 pointer-events-none" />

        {/* Avatar */}
        <div className="relative flex-shrink-0 group">
          <label className="cursor-pointer block relative">
            {profileUser.photoUrl ? (
              <Image
                src={profileUser.photoUrl}
                alt={profileUser.name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-2xl border-2 border-violet-500/30 shadow-lg object-cover group-hover:border-violet-500 transition-colors"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-violet-500/30 group-hover:border-violet-500 transition-colors">
                <span className="text-3xl font-extrabold text-white">{getUserInitials(profileUser.name)}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64 = reader.result as string;
                    try {
                      const token = await getAuthToken();
                      await fetch(`/api/users/${profileUser.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          name: profileUser.name,
                          email: profileUser.email,
                          dob: profileUser.dob || '',
                          gender: profileUser.gender || '',
                          address: profileUser.address || '',
                          town: profileUser.town || '',
                          state: profileUser.state || '',
                          district: profileUser.district || '',
                          phone: profileUser.phone || '',
                          photoUrl: base64,
                        })
                      });
                      window.location.reload();
                    } catch (err) {
                      console.error('Error uploading photo:', err);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-violet-500/30 text-[10px] font-bold text-violet-400 uppercase pointer-events-none">
            {profileUser.role}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h1 className="text-2xl font-extrabold text-white tracking-tight truncate">{profileUser.name}</h1>
            <button
              onClick={() => {
                setCurrentStep(1);
                setShowOnboarding(true);
              }}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Edit Profile Info"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-400">{profileUser.email}</p>
          
          {profileUser.phone && (
            <p className="text-xs text-gray-400 font-mono">Contact: {profileUser.phone}</p>
          )}

          {profileUser.town && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              <span>Locality/Ward: {profileUser.town} ({profileUser.district}, {profileUser.state})</span>
            </div>
          )}

          {profileUser.address && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              <span>Address: {profileUser.address}</span>
            </div>
          )}

          {profileUser.dob && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>DOB: {new Date(profileUser.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({profileUser.age} yrs, {profileUser.gender})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>Member since {new Date(profileUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Points display */}
        <div className="flex flex-col items-center gap-1 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-6 py-4 flex-shrink-0">
          <span className="text-3xl font-extrabold text-white">{profileUser.points.toLocaleString()}</span>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Points</span>
          <div className="mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
            ★ Community Hero
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('reported'), value: profileUser.issuesReported, icon: <Camera className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: t('validated'), value: profileUser.issuesValidated, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: t('resolved'), value: resolvedCount, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
          { label: t('open'), value: openCount, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 flex flex-col items-center gap-2 border', stat.bg)}>
            <div className={stat.color}>{stat.icon}</div>
            <span className="text-2xl font-extrabold text-white">{stat.value}</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-xl border border-white/5 w-fit">
        {(['reports', 'badges'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {tab === 'reports' ? (
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {t('myReports')}</span>
            ) : (
              <span className="flex items-center gap-2"><Medal className="w-4 h-4" /> {t('badges')}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Reports Tab ── */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">
          {issues.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-white font-bold">{t('noReports')}</p>
              <p className="text-sm text-gray-400">{t('noReportsSub')}</p>
              <Link
                href="/report"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Camera className="w-4 h-4" /> Report an Issue
              </Link>
            </div>
          ) : (
            issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="glass-card p-5 flex flex-col gap-3 hover:border-white/15 transition-all duration-200 group border border-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white line-clamp-1 group-hover:text-violet-300 transition-colors flex-1">
                    {issue.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.low)}>
                    {issue.severity}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase', STATUS_STYLE[issue.status] || 'bg-zinc-800 text-gray-400')}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-zinc-800/60">
                    {issue.category}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-violet-400/60" />
                    <span className="truncate max-w-[200px]">{issue.location?.address || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-violet-400 font-semibold">▲ {issue.upvotes}</span>
                    <span>{timeAgo(issue.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}

          {issues.length > 0 && (
            <Link
              href="/track"
              className="text-center text-sm font-semibold text-violet-400 hover:text-violet-300 py-2 transition-colors"
            >
              {t('trackAll')}
            </Link>
          )}
        </div>
      )}

      {/* ── Badges Tab ── */}
      {activeTab === 'badges' && (
        <div className="flex flex-col gap-4">
          {profileUser.badges.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-white font-bold">{t('noBadges')}</p>
              <p className="text-sm text-gray-400">{t('noBadgesSub')}</p>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 rounded-xl text-white text-sm font-bold hover:bg-zinc-700 transition-colors border border-white/10"
              >
                <Trophy className="w-4 h-4 text-amber-400" /> View Leaderboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileUser.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="glass-card p-5 flex items-start gap-4 border border-white/5"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-lg',
                    BADGE_COLORS[badge.id] || 'from-gray-600 to-gray-700'
                  )}>
                    {BADGE_ICONS[badge.id] || <Star className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{badge.description}</p>
                    <p className="text-[10px] text-gray-600 mt-1.5">
                      Earned {new Date(badge.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Locked badges preview */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">{t('badgesToUnlock')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'validator_pro', name: 'Validator Pro', hint: 'Validate 25+ issues' },
                { id: 'impact_maker', name: 'Impact Maker', hint: '5 issues resolved' },
                { id: 'streak_hero', name: 'Streak Hero', hint: 'Report 7 days in a row' },
                { id: 'top_contributor', name: 'Top Contributor', hint: 'Reach 500 points' },
              ]
                .filter((b) => !profileUser.badges.some((earned) => earned.id === b.id))
                .map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900/40 border border-white/5 opacity-50">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-gray-600">
                      {BADGE_ICONS[b.id] || <Star className="w-5 h-5" />}
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 text-center">{b.name}</p>
                    <p className="text-[9px] text-gray-600 text-center">{b.hint}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding / Edit Profile Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 flex flex-col gap-6 relative border border-violet-500/20 shadow-2xl bg-zinc-950/95 rounded-2xl">
            
            {/* Close button */}
            <button 
              onClick={() => setShowOnboarding(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <h3 className="text-xl font-extrabold text-white">{t('setupProfile')}</h3>
              <p className="text-xs text-gray-400 mt-1">{t('setupProfileSub')}</p>
            </div>

            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                <span>Question {currentStep} of 8</span>
                <span>{Math.round((currentStep / 8) * 100)}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${(currentStep / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[140px] flex flex-col justify-center">
              {currentStep === 1 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">What is your name?</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Select your gender</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormGender(g)}
                        className={cn(
                          "py-3 rounded-xl border font-semibold text-sm transition-all duration-200",
                          formGender === g
                            ? "bg-violet-600/20 border-violet-500 text-white shadow-md"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Residential Address</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                    placeholder="Enter your residential address"
                  />
                </div>
              )}

              {currentStep === 6 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Which ward, village or locality?</label>
                  <input
                    type="text"
                    value={formTown}
                    onChange={(e) => setFormTown(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                    placeholder="e.g. Ward 12 or Rampur Village"
                  />
                </div>
              )}

              {currentStep === 7 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">State & District</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={formStateVal}
                      onChange={(e) => setFormStateVal(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      placeholder="State (e.g. Delhi)"
                    />
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      placeholder="District (e.g. Central Delhi)"
                    />
                  </div>
                </div>
              )}

              {currentStep === 8 && (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Contact Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                    placeholder="Enter your contact number"
                  />
                </div>
              )}
            </div>

            {/* Onboarding Error display */}
            {onboardingError && (
              <p className="text-xs font-medium text-red-400">{onboardingError}</p>
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between items-center gap-4 mt-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || submittingOnboarding}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all text-xs shadow-md shadow-violet-500/20"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOnboardingSubmit}
                  disabled={submittingOnboarding}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all text-xs disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-violet-500/20"
                >
                  {submittingOnboarding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Save & Update <UserCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
