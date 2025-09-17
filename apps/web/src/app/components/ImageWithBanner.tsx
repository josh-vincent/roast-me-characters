'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { addBannerToImage } from '@roast-me/ui';

interface ImageWithBannerProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  bannerText?: string;
  showBanner?: boolean;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}

export function ImageWithBanner({ 
  src, 
  alt, 
  fill = false, 
  className = '', 
  bannerText = 'roastme.tocld.com',
  showBanner = true,
  priority = false,
  sizes,
  width,
  height
}: ImageWithBannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [compositeImageSrc, setCompositeImageSrc] = useState<string | null>(null);
  const [isCreatingComposite, setIsCreatingComposite] = useState(false);

  useEffect(() => {
    if (imageLoaded && showBanner && !compositeImageSrc && !isCreatingComposite) {
      setIsCreatingComposite(true);
      addBannerToImage(src, bannerText)
        .then((dataUrl) => {
          setCompositeImageSrc(dataUrl);
        })
        .catch((error) => {
          console.error('Failed to create composite image:', error);
          // Fallback to original image
          setCompositeImageSrc(src);
        })
        .finally(() => {
          setIsCreatingComposite(false);
        });
    }
  }, [imageLoaded, showBanner, src, bannerText, compositeImageSrc, isCreatingComposite]);

  // Show original image while loading or if banner is disabled
  if (!showBanner || !compositeImageSrc) {
    return (
      <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className="object-cover"
          onLoad={() => setImageLoaded(true)}
          priority={priority}
          sizes={sizes || (fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined)}
        />
        
        {/* CSS Overlay Banner (fallback for loading state) */}
        {showBanner && imageLoaded && !compositeImageSrc && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="bg-black/75 backdrop-blur-sm">
              <div className="bg-gradient-to-b from-black/80 to-black/60 px-4 py-2">
                <div className="text-center">
                  <span className="text-white text-sm font-bold tracking-wide drop-shadow-lg">
                    {bannerText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show composite image with embedded banner (right-click saveable)
  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      <Image
        src={compositeImageSrc}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className="object-cover"
        priority={priority}
        sizes={sizes || (fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined)}
        onContextMenu={(e) => {
          // Allow right-click context menu for saving
          e.stopPropagation();
        }}
      />
    </div>
  );
}