'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WifiOff } from 'lucide-react';

interface OnlineStatusContextType {
  isOnline: boolean;
  isStandalone: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  isOnline: true,
  isStandalone: false,
});

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}

interface OnlineStatusProviderProps {
  children: ReactNode;
}

export function OnlineStatusProvider({ children }: OnlineStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator &&
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
    );

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OnlineStatusContext.Provider value={{ isOnline, isStandalone }}>
      {children}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
          <WifiOff className="w-4 h-4" />
          You&apos;re offline
        </div>
      )}
    </OnlineStatusContext.Provider>
  );
}
