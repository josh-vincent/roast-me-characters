'use client';

import { useState, useEffect } from 'react';

interface GenerationProgressProps {
  status: 'analyzing' | 'roasting' | 'creating' | 'finalizing';
  hasTimedOut?: boolean;
}

export function GenerationProgress({ status, hasTimedOut }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Map status to progress percentage
  const statusToProgress = {
    'analyzing': 25,
    'roasting': 50,
    'creating': 75,
    'finalizing': 90
  };

  // Estimated times for each step (in seconds)
  const stepDurations = {
    'analyzing': 5,
    'roasting': 10,
    'creating': 35,
    'finalizing': 10
  };

  useEffect(() => {
    const targetProgress = statusToProgress[status] || 0;
    
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 1) {
          return targetProgress;
        }
        return prev + diff * 0.1; // Smooth animation
      });
    }, 50);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    // Update elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getEstimatedTimeRemaining = () => {
    const totalEstimated = Object.values(stepDurations).reduce((a, b) => a + b, 0);
    const currentStepIndex = Object.keys(statusToProgress).indexOf(status);
    const remainingSteps = Object.keys(statusToProgress).slice(currentStepIndex + 1);
    const remainingTime = remainingSteps.reduce((acc, step) => 
      acc + stepDurations[step as keyof typeof stepDurations], 0
    );
    return remainingTime;
  };

  if (hasTimedOut) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Taking longer than expected...</span>
            <span>{formatTime(timeElapsed)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-orange-500 h-full rounded-full transition-all duration-500 animate-pulse"
              style={{ width: '95%' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {Math.round(progress)}%</span>
          <span>~{getEstimatedTimeRemaining()}s remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between text-xs">
        <div className={`flex flex-col items-center ${progress >= 25 ? 'text-purple-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mb-1 ${progress >= 25 ? 'bg-purple-600' : 'bg-gray-400'}`} />
          <span>Analyze</span>
        </div>
        <div className={`flex flex-col items-center ${progress >= 50 ? 'text-purple-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mb-1 ${progress >= 50 ? 'bg-purple-600' : 'bg-gray-400'}`} />
          <span>Roast</span>
        </div>
        <div className={`flex flex-col items-center ${progress >= 75 ? 'text-purple-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mb-1 ${progress >= 75 ? 'bg-purple-600' : 'bg-gray-400'}`} />
          <span>Create</span>
        </div>
        <div className={`flex flex-col items-center ${progress >= 90 ? 'text-purple-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mb-1 ${progress >= 90 ? 'bg-purple-600' : 'bg-gray-400'}`} />
          <span>Finalize</span>
        </div>
      </div>
      
      {/* Time elapsed */}
      <div className="text-center mt-4 text-xs text-gray-500">
        Time elapsed: {formatTime(timeElapsed)}
      </div>
    </div>
  );
}