'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onError?: () => void;
  showLoadingState?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function SafeImage({ 
  src, 
  fallbackSrc,
  alt, 
  fill = false,
  className = '',
  sizes,
  priority = false,
  onError,
  showLoadingState = true,
  maxRetries = 3,
  retryDelay = 1000
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Reset when src changes
  useEffect(() => {
    if (src !== imgSrc) {
      setImgSrc(src);
      setRetryCount(0);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = () => {
    console.warn(`Failed to load image: ${imgSrc}, attempt ${retryCount + 1}/${maxRetries}`);
    
    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Try retry logic first
    if (retryCount < maxRetries && imgSrc === src) {
      const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
      
      console.log(`Retrying image load in ${delay}ms...`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Add cache buster to force retry
        const separator = (src?.toString() || '').includes('?') ? '&' : '?';
        setImgSrc(`${src}${separator}retry=${Date.now()}`);
      }, delay);
    } else if (fallbackSrc && imgSrc !== fallbackSrc) {
      // Try fallback image after retries exhausted
      console.log('Using fallback image after retries exhausted');
      setImgSrc(fallbackSrc);
      setRetryCount(0); // Reset for fallback attempts
    } else {
      // No more options, show error state
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Show placeholder if no image or error
  if (!imgSrc || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${fill ? 'absolute inset-0' : 'w-full h-full'} ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🎭</div>
          <p className="text-xs">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading state with retry indicator */}
      {showLoadingState && isLoading && (
        <div className={`flex items-center justify-center bg-gray-100 animate-pulse ${fill ? 'absolute inset-0 z-10' : 'w-full h-full'}`}>
          <div className="text-center">
            {retryCount > 0 ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-500">Retrying... ({retryCount}/{maxRetries})</p>
              </div>
            ) : (
              <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            )}
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized // Allow external URLs
      />
    </>
  );
}