'use client';

import { useState } from 'react';
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
  showLoadingState = true
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.error(`Failed to load image: ${imgSrc}`);
    
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      // Try fallback image
      setImgSrc(fallbackSrc);
    } else {
      // No fallback or fallback also failed
      setHasError(true);
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
      {/* Loading state */}
      {showLoadingState && isLoading && (
        <div className={`flex items-center justify-center bg-gray-100 animate-pulse ${fill ? 'absolute inset-0' : 'w-full h-full'}`}>
          <div className="text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
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