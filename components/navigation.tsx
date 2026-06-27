'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import {
  Camera,
  MapPin,
  Trophy,
  ShieldAlert,
  BarChart3,
  Home,
  LogIn,
  LogOut,
  User,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const defaultItems = [
    { name: t('home'), href: '/', icon: Home },
    { name: t('report'), href: '/report', icon: Camera },
    { name: t('map'), href: '/map', icon: MapPin },
    { name: t('leaderboard'), href: '/leaderboard', icon: Trophy },
  ];

  const getDesktopNavItems = () => {
    if (!mounted || !user) return defaultItems;
    const items = [...defaultItems];
    if (user.role === 'authority' || user.role === 'admin') {
      items.push({ name: t('authority'), href: '/dashboard', icon: ShieldAlert });
    }
    if (user.role === 'admin') {
      items.push({ name: t('analytics'), href: '/analytics', icon: BarChart3 });
    }
    return items;
  };

  const getMobileNavItems = () => {
    if (!mounted || !user) return defaultItems;
    const items = [
      { name: t('home'), href: '/', icon: Home },
      { name: t('report'), href: '/report', icon: Camera },
      { name: t('map'), href: '/map', icon: MapPin },
    ];
    if (user.role === 'authority' || user.role === 'admin') {
      items.push({ name: t('authority'), href: '/dashboard', icon: ShieldAlert });
    } else {
      items.push({ name: t('leaderboard'), href: '/leaderboard', icon: Trophy });
    }
    return items;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const showUser = mounted ? user : null;

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-lg border-b border-zinc-200/80 flex items-center justify-between px-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Community_Hero_logo.png"
            alt="Community Hero Logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain rounded-lg"
          />
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in">
            {t('logoText')}
          </span>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-200",
                language === 'en' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-200/50"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-200",
                language === 'hi' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-200/50"
              )}
            >
              हिं
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 glass-nav items-center justify-between px-8 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/Community_Hero_logo.png"
            alt="Community Hero Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain rounded-lg"
          />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {t('logoText')}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {getDesktopNavItems().map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-violet-600/10 text-violet-600 border border-violet-600/20 font-semibold" 
                    : "text-gray-600 hover:text-violet-700 hover:bg-violet-600/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Profile / Authentication Controls */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200 mr-1">
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200",
                language === 'en' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-200/50"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200",
                language === 'hi' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-200/50"
              )}
            >
              हिं
            </button>
          </div>

          {showUser ? (
            <div className="flex items-center gap-2">
              {/* Profile link */}
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-violet-500/5 transition-colors group"
                title="My Profile"
              >
                {showUser.photoUrl ? (
                  <Image
                    src={showUser.photoUrl}
                    alt={showUser.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-violet-500/30 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md border border-violet-500/30">
                    {getUserInitials(showUser.name)}
                  </div>
                )}
                <UserCircle className="w-3.5 h-3.5 text-gray-500 group-hover:text-violet-600 transition-colors" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-600/5 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-zinc-200/80 flex items-center justify-around px-2 pb-safe z-50">
        {getMobileNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-violet-600 font-semibold" 
                  : "text-gray-500 hover:text-violet-600"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
        
        {/* Mobile Profile / Login Link */}
        <Link
          href={showUser ? '/profile' : '/login'}
          className={cn(
            'flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors',
            pathname === '/profile' ? 'text-violet-600 font-semibold' : 'text-gray-500 hover:text-violet-600'
          )}
        >
          <UserCircle className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium tracking-tight">{showUser ? 'Profile' : 'Login'}</span>
        </Link>
      </nav>
    </>
  );
}
