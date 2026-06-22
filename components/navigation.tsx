'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Camera, 
  MapPin, 
  Trophy, 
  ShieldAlert, 
  BarChart3, 
  Home,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Report', href: '/report', icon: Camera },
    { name: 'Map', href: '/map', icon: MapPin },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Authority', href: '/dashboard', icon: ShieldAlert },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

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

        {/* Profile Mock */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Rank #12 in Ward 12</p>
            <p className="text-xs font-semibold text-amber-400">★ 240 pts</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md border border-white/10">
            MK
          </div>
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
      </nav>
    </>
  );
}
