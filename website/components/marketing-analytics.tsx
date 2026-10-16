'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
export function MarketingAnalytics() {
  const pathname = usePathname();
  useEffect(() => { window.dispatchEvent(new Event('wm:analytics-route')); }, [pathname]);
  return <Script src="/consent-analytics.js" strategy="afterInteractive" onLoad={() => window.dispatchEvent(new Event('wm:analytics-route'))} />;
}
