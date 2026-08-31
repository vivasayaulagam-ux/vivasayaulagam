'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/meta/pixel';

export default function MetaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Prevent duplicate PageView tracking on React 19 / StrictMode re-renders or hydration
    if (lastTrackedUrlRef.current === currentUrl) {
      return;
    }

    lastTrackedUrlRef.current = currentUrl;
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
