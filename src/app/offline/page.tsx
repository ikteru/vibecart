'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <WifiOff size={36} className="text-zinc-600" />
      </div>

      <h1 className="text-white text-xl font-bold mb-2">
        You&apos;re offline
      </h1>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed mb-8">
        Check your internet connection and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
