'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Laptop, BarChart3, Package, Users, MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      shortName: 'Home',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Inventory',
      shortName: 'Stock',
      href: '/inventory',
      icon: Laptop,
    },
    {
      name: 'Statistics',
      shortName: 'Stats',
      href: '/stats',
      icon: BarChart3,
    },
    {
      name: 'Sales',
      shortName: 'Sales',
      href: '/sales',
      icon: Package,
    },
    {
      name: 'Dealers',
      shortName: 'Dealers',
      href: '/dealers',
      icon: Users,
    },
  ];

  return (
    <nav className="sticky top-3 z-50 w-full max-w-2xl mx-auto mb-8 px-2">
      <div className="flex items-center justify-between gap-1 p-1.5 sm:p-2 rounded-full bg-white/70 dark:bg-slate-900/75 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all">
        
        {/* Theme Toggle Button */}
        <motion.button
          type="button"
          aria-label="Toggle theme"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex shrink-0 h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-xs dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {!mounted ? (
            <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={resolvedTheme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {resolvedTheme === 'dark' ? (
                  <SunMedium className="h-4 w-4 text-amber-400" />
                ) : (
                  <MoonStar className="h-4 w-4 text-indigo-600" />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

        {/* Navigation Tabs - Fully visible across mobile screens with zero scrolling */}
        <div className="grid grid-cols-5 flex-1 items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="relative block w-full text-center">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative z-10 flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 sm:py-2 px-1 sm:px-3 rounded-full text-[10px] sm:text-sm font-semibold transition-colors touch-manipulation cursor-pointer",
                    isActive
                      ? "text-white font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0", isActive ? "text-white" : "text-slate-500 dark:text-slate-400")} />
                  
                  {/* Full title on desktop, compact title on mobile */}
                  <span className="truncate hidden sm:inline">{item.name}</span>
                  <span className="truncate sm:hidden text-[9px] leading-none">{item.shortName}</span>
                </motion.div>

                {/* Animated active tab pill slider */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-md shadow-indigo-500/30 z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
