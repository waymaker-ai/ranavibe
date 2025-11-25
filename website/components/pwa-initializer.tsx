'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

export function PWAInitializer() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
