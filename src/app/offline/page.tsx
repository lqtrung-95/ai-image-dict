'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-800/50 border-slate-700 p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/20 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-orange-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">You&apos;re Offline</h1>

        <p className="text-slate-400 mb-6">
          It looks like you&apos;ve lost your internet connection. Some features may not be available
          until you&apos;re back online.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Link href="/">
            <Button variant="outline" className="w-full border-slate-600">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-400">Available offline:</strong>
          </p>
          <ul className="text-sm text-slate-500 mt-2 space-y-1">
            <li>• View cached vocabulary</li>
            <li>• Practice saved words</li>
            <li>• View progress statistics</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
