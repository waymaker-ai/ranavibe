import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mb-6 inline-flex p-4 rounded-full bg-background-secondary">
          <WifiOff className="h-12 w-12 text-foreground-secondary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">You&apos;re offline</h1>
        <p className="text-lg text-foreground-secondary mb-8 max-w-md">
          It looks like you&apos;ve lost your internet connection. Some cached pages
          may still be available.
        </p>
        <Link href="/" className="btn-primary px-6 py-3 inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}
