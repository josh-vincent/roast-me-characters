'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditDisplayProps {
  compact?: boolean;
  showResetTime?: boolean;
  className?: string;
}

export function CreditDisplay({ compact = false, showResetTime = false, className = '' }: CreditDisplayProps) {
  const { getCreditBalance, user } = useAuth();
  const [creditBalance, setCreditBalance] = useState<{
    dailyAvailable: number;
    dailyUsed: number;
    purchasedCredits: number;
    totalAvailable: number;
    nextResetTime: Date;
  } | null>(null);
  const [timeToReset, setTimeToReset] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      setLoading(true);
      try {
        const balance = await getCreditBalance();
        setCreditBalance(balance);
      } catch (error) {
        console.error('Error fetching credit balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [getCreditBalance, user]);

  useEffect(() => {
    if (!creditBalance?.nextResetTime || !showResetTime) return;

    const updateTimer = () => {
      const now = new Date();
      const reset = new Date(creditBalance.nextResetTime);
      const diff = reset.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeToReset('Resetting...');
        // Refresh credits
        getCreditBalance().then(setCreditBalance);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeToReset(`${hours}h ${minutes}m`);
      } else {
        setTimeToReset(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [creditBalance?.nextResetTime, showResetTime, getCreditBalance]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!creditBalance) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        {creditBalance.dailyAvailable > 0 && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            {creditBalance.dailyAvailable} daily
          </span>
        )}
        {creditBalance.purchasedCredits > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {creditBalance.purchasedCredits} purchased
          </span>
        )}
        {creditBalance.totalAvailable === 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            No credits
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="space-y-3">
        {/* Daily Credits */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Daily Credits</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-purple-600">
              {creditBalance.dailyAvailable}
            </span>
            <span className="text-sm text-gray-500">/ 3</span>
          </div>
        </div>

        {/* Progress bar for daily credits */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(creditBalance.dailyAvailable / 3) * 100}%` }}
          ></div>
        </div>

        {/* Purchased Credits */}
        {creditBalance.purchasedCredits > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Purchased</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {creditBalance.purchasedCredits}
            </span>
          </div>
        )}

        {/* Reset Timer */}
        {showResetTime && creditBalance.dailyUsed > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Daily reset in</span>
            <span className="text-xs font-medium text-gray-700">{timeToReset}</span>
          </div>
        )}

        {/* Total Available */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Total Available</span>
          <span className="text-xl font-bold text-gray-900">
            {creditBalance.totalAvailable}
          </span>
        </div>
      </div>
    </div>
  );
}