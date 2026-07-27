'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Laptop, BarChart3, Package, Users, MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Laptop,
    },
    {
      name: 'Statistics',
      href: '/stats',
      icon: BarChart3,
    },
    {
      name: 'Sales',
      href: '/sales',
      icon: Package,
    },
    {
      name: 'Dealers',
      href: '/dealers',
      icon: Users,
    },
  ];

  return (
    <nav className="sticky top-3 z-50 flex items-center justify-between sm:justify-center gap-1.5 p-1.5 sm:p-2 rounded-full w-[calc(100%-1rem)] sm:w-auto max-w-2xl mx-auto mb-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all overflow-x-auto no-scrollbar">
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm transition-all duration-200 active:scale-90 hover:scale-105 hover:bg-slate-100 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
      >
        {!mounted ? (
          <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
        ) : resolvedTheme === 'dark' ? (
          <SunMedium className="h-4 w-4 text-amber-400" />
        ) : (
          <MoonStar className="h-4 w-4 text-indigo-600" />
        )}
      </button>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 touch-manipulation",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isActive ? "text-white" : "text-slate-500 dark:text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
