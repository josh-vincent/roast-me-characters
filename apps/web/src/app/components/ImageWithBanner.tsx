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
  const [imageSrc, setImageSrc] = useState(src);

  // Helper function to convert transform URL to original URL
  const getOriginalUrl = (transformUrl: string): string => {
    if (transformUrl.includes('/render/image/')) {
      const parts = transformUrl.split('/render/image/')[1].split('?')[0];
      return transformUrl.split('/render/image/')[0] + '/object/' + parts;
    }
    return transformUrl;
  };

  // Disable composite image creation for better performance and caching
  // useEffect(() => {
  //   if (imageLoaded && showBanner && !compositeImageSrc && !isCreatingComposite) {
  //     setIsCreatingComposite(true);
  //     addBannerToImage(imageSrc, bannerText)
  //       .then((dataUrl) => {
  //         setCompositeImageSrc(dataUrl);
  //       })
  //       .catch((error) => {
  //         console.error('Failed to create composite image:', error);
  //         // Fallback to original image
  //         setCompositeImageSrc(src);
  //       })
  //       .finally(() => {
  //         setIsCreatingComposite(false);
  //       });
  //   }
  // }, [imageLoaded, showBanner, imageSrc, bannerText, compositeImageSrc, isCreatingComposite]);

  // Update imageSrc when src prop changes
  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  // Always show original image with CSS overlay for better performance and caching
  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className="object-cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          // Fallback to original image if transformation fails
          const originalUrl = getOriginalUrl(imageSrc);
          if (originalUrl !== imageSrc) {
            console.log('Image transform failed, falling back to original:', originalUrl);
            setImageSrc(originalUrl);
          }
        }}
        priority={priority}
        sizes={sizes || (fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined)}
      />
      
      {/* CSS Overlay Banner */}
      {showBanner && imageLoaded && (
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