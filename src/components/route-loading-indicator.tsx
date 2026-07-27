"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const previousPath = useRef(pathname);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (pathname === previousPath.current) return;
    previousPath.current = pathname;
    setIsLoading(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  return isLoading ? (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden">
      <div className="h-full w-full animate-route-progress bg-gradient-to-r from-primary via-cyan-400 to-blue-500" />
    </div>
  ) : null;
}
