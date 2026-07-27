"use client";

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

export function PageLoading() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => {
      setShow(false);
    }, 2200);

    return () => {
      window.clearTimeout(minimumTimer);
    };
  }, []);

  return <LoadingScreen open={show} />;
}
