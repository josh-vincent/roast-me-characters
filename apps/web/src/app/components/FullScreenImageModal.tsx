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
  originalImageSrc?: string;
  figurineName?: string;
}

export function FullScreenImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title,
  onDownload,
  onShare,
  showBanner = true,
  originalImageSrc,
  figurineName
}: FullScreenImageModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Reset states when opening
      setIsZoomed(false);
      setImageLoaded(false);
      setControlsVisible(true);
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
      // Clear timeout on cleanup
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
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

  // Handle showing/hiding controls
  const handleInteraction = () => {
    // Toggle controls visibility
    setControlsVisible(!controlsVisible);
    
    // Clear existing timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    // If we're showing controls, hide them after 3 seconds
    if (!controlsVisible) {
      const timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      setHideTimeout(timeout);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Header with controls - show/hide based on controlsVisible */}
      <div className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
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
        className="absolute inset-0 flex items-center justify-center p-0 sm:p-8"
        onClick={(e) => {
          // Toggle controls on background click
          if (e.target === e.currentTarget) {
            handleInteraction();
          }
        }}
      >
        <div 
          className={`relative w-full h-full sm:max-w-4xl sm:max-h-[90vh] flex items-center justify-center transition-transform duration-300 ease-out ${
            isZoomed ? 'scale-150 sm:scale-125' : 'scale-100'
          }`}
          style={{
            touchAction: 'manipulation',
          }}
          onClick={handleInteraction}
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
          
          {/* Main generated image */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error('Failed to load full-screen image:', imageSrc);
              // Try without any transformations if it fails
              const img = e.currentTarget as HTMLImageElement;
              if (imageSrc.includes('/render/image/')) {
                const originalUrl = imageSrc.replace('/render/image/', '/object/').split('?')[0];
                img.src = originalUrl;
              }
            }}
          />
          
          {/* Banner across top of image - responsive positioning */}
          {showBanner && (
            <div className="absolute top-0 sm:top-[8%] left-0 right-0 bg-gradient-to-b from-black/95 to-black/85 px-4 py-3 flex items-center justify-center border-b-4 border-orange-500/60">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="text-white font-bold text-lg tracking-wide">roastme.tocld.com</span>
              </div>
            </div>
          )}
          
          {/* Original image overlay - 1/4 size, bottom right corner */}
          {originalImageSrc && showBanner && (
            <div className="absolute bottom-0 right-0 w-[25%] h-[25%] border-2 border-white shadow-lg">
              <img
                src={originalImageSrc}
                alt="Original"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom instructions - mobile only */}
      <div className={`absolute bottom-0 left-0 right-0 sm:hidden bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="text-center text-white/80 text-sm">
          <p>Tap to show/hide controls</p>
        </div>
      </div>

      {/* Desktop instructions */}
      <div className={`hidden sm:block absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm transition-opacity duration-300 ${
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center space-x-4">
          <span>Click to show/hide controls</span>
          <span>•</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}