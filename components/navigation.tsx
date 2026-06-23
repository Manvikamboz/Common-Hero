'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  Camera, 
  MapPin, 
  Trophy, 
  ShieldAlert, 
  BarChart3, 
  Home,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Report', href: '/report', icon: Camera },
    { name: 'Map', href: '/map', icon: MapPin },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Authority', href: '/dashboard', icon: ShieldAlert },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

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

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 glass-nav items-center justify-between px-8 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white text-base">CH</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            CommunityHero
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/25" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Profile / Authentication Controls */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-white font-semibold max-w-[120px] truncate">{user.name}</p>
                <p className="text-[10px] text-amber-400 font-medium">★ {user.points} pts</p>
              </div>
              
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border border-white/10 shadow-md object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md border border-white/10">
                  {getUserInitials(user.name)}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-lg border-t border-white/5 flex items-center justify-around px-2 pb-safe z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-violet-400" 
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
        
        {/* Mobile Profile Link */}
        <Link
          href={user ? "#" : "/login"}
          onClick={user ? handleLogout : undefined}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
          title={user ? "Sign Out" : "Sign In"}
        >
          {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          <span className="text-[10px] mt-1 font-medium tracking-tight">{user ? 'Logout' : 'Login'}</span>
        </Link>
      </nav>
    </>
  );
}
