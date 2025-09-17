'use client';

import { useState, useEffect } from 'react';
import { ImageWithBanner } from './ImageWithBanner';

interface ProgressiveImageWithBannerProps {
  lowResSrc?: string;
  highResSrc: string;
  alt: string;
  fill?: boolean;
  className?: string;
  bannerText?: string;
  showBanner?: boolean;
  priority?: boolean;
  sizes?: string;
}

export function ProgressiveImageWithBanner({
  lowResSrc,
  highResSrc,
  alt,
  fill = false,
  className = '',
  bannerText = 'roastme.tocld.com',
  showBanner = true,
  priority = false,
  sizes
}: ProgressiveImageWithBannerProps) {
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(lowResSrc || highResSrc);

  useEffect(() => {
    if (!lowResSrc || !highResSrc || lowResSrc === highResSrc) {
      // No progressive loading needed
      setCurrentSrc(highResSrc);
      setIsHighResLoaded(true);
      return;
    }

    // Start with low-res image
    setCurrentSrc(lowResSrc);
    
    // Preload high-res image
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(highResSrc);
      setIsHighResLoaded(true);
    };
    img.onerror = () => {
      console.warn('Failed to load high-res image, keeping low-res:', highResSrc);
      setIsHighResLoaded(true); // Stop loading state even on error
    };
    img.src = highResSrc;
  }, [lowResSrc, highResSrc]);

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      <ImageWithBanner
        src={currentSrc}
        alt={alt}
        fill={fill}
        className={`transition-opacity duration-300 ${isHighResLoaded ? 'opacity-100' : 'opacity-90'}`}
        bannerText={bannerText}
        showBanner={showBanner}
        priority={priority}
        sizes={sizes}
      />
      
      {/* Loading indicator for progressive loading */}
      {!isHighResLoaded && lowResSrc && lowResSrc !== highResSrc && (
        <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm rounded-full p-1">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}