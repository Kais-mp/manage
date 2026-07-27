'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Laptop, BarChart3, Package, MoonStar, SunMedium } from 'lucide-react';
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
      icon: Laptop,
    },
  ];

  return (
    <nav className="flex flex-wrap justify-center items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-2 rounded-3xl w-full max-w-full mx-auto mb-6 shadow-sm">
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {mounted && resolvedTheme === 'dark' ? (
          <SunMedium className="h-4 w-4" />
        ) : (
          <MoonStar className="h-4 w-4" />
        )}
      </button>

      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex min-w-[110px] items-center justify-center gap-2 px-3 py-2 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200",
            pathname === item.href
              ? "bg-primary text-primary-foreground shadow-md": "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/75"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="inline">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
