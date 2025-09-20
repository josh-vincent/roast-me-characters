'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { ImageWithBanner } from './ImageWithBanner';

interface FullScreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  title?: string;
  onDownload?: () => void;
  onShare?: () => void;
  showBanner?: boolean;
}

export function FullScreenImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title,
  onDownload,
  onShare,
  showBanner = true
}: FullScreenImageModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Reset zoom when opening
      setIsZoomed(false);
      setImageLoaded(false);
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle touch gestures for zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || e.changedTouches.length !== 1) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = Math.abs(touchEnd.x - touchStart.x);
    const deltaY = Math.abs(touchEnd.y - touchStart.y);

    // If it's a tap (small movement), toggle zoom
    if (deltaX < 10 && deltaY < 10) {
      setIsZoomed(!isZoomed);
    }

    setTouchStart(null);
  };

  const handleDoubleClick = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title && (
              <h2 className="text-white text-lg font-semibold truncate pr-4">
                {title}
              </h2>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Zoom toggle - desktop only */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="hidden sm:flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? (
                <ZoomOut className="w-5 h-5 text-white" />
              ) : (
                <ZoomIn className="w-5 h-5 text-white" />
              )}
            </button>
            
            {/* Share button */}
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Download button */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                aria-label="Download"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Image container */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-16"
        onClick={(e) => {
          // Close modal if clicking the background (not the image)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className={`relative max-w-full max-h-full transition-transform duration-300 ease-out ${
            isZoomed ? 'scale-150 sm:scale-200' : 'scale-100'
          }`}
          style={{
            touchAction: 'manipulation',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {/* Loading state */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
            </div>
          )}
          
          {showBanner ? (
            <div className="relative" style={{ width: '800px', height: '800px', maxWidth: '100%', maxHeight: '100%' }}>
              <ImageWithBanner
                src={imageSrc}
                alt={imageAlt}
                fill
                className={`rounded-lg shadow-2xl transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                showBanner={true}
                priority
                sizes="100vw"
              />
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={800}
              height={800}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              priority
              sizes="100vw"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto'
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom instructions - mobile only */}
      <div className="absolute bottom-0 left-0 right-0 sm:hidden bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="text-center text-white/80 text-sm">
          <p>Tap to zoom • Swipe to close</p>
        </div>
      </div>

      {/* Desktop instructions */}
      <div className="hidden sm:block absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
        <div className="flex items-center space-x-4">
          <span>Click image or use zoom buttons</span>
          <span>•</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}