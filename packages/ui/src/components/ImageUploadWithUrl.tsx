import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Link, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

// Helper function to handle image orientation
const createImageWithOrientation = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to image dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image onto the canvas (this automatically handles most orientation issues)
        ctx?.drawImage(img, 0, 0);
        
        // Convert canvas to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

interface ImageUploadWithUrlProps {
  onUpload: (file: File | string) => void; // Can accept File or URL string
  isLoading?: boolean;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUploadWithUrl({
  onUpload,
  isLoading = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  className,
}: ImageUploadWithUrlProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');

  const validateFile = (file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      setError(`Please upload a valid image file (${acceptedTypes.join(', ')})`);
      return false;
    }
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return false;
    }
    return true;
  };


  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setError(null);
    
    try {
      // Handle image orientation for preview
      const orientedPreview = await createImageWithOrientation(file);
      setPreview(orientedPreview);
    } catch (error) {
      // Fallback to basic preview if orientation handling fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    onUpload(file);
  }, [onUpload, maxSize, acceptedTypes]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasImageExtension = imageExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      );
      if (!hasImageExtension && !url.includes('unsplash') && !url.includes('pexels')) {
        setError('URL should point to an image file');
        return false;
      }
      return true;
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
  };

  const handleUrl = useCallback(() => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(urlInput)) return;

    setError(null);
    setPreview(urlInput);
    onUpload(urlInput);
  }, [urlInput, onUpload]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    setUrlInput('');
  };

  return (
    <div className={clsx('w-full', className)}>
      {preview ? (
        <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain"
            onError={() => setError('Failed to load image')}
          />
          {!isLoading && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
            </div>
          )}
        </div>
      ) : (
        <div>
          {inputMode === 'file' ? (
            <label
              className={clsx(
                'relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center py-4">
                {isDragging ? (
                  <ImageIcon className="w-8 h-8 mb-2 text-purple-500" />
                ) : (
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                )}
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold">Click to select</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP, or HEIC (MAX. {maxSize / 1024 / 1024}MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isLoading}
                multiple={false}
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrl()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleUrl}
                  disabled={isLoading || !urlInput.trim()}
                  className={clsx(
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    isLoading || !urlInput.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  )}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Paste any image URL from the web
              </p>
            </div>
          )}
          
          {/* Mode Switcher Below Content */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setInputMode('file')}
              className={clsx(
                'flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors',
                inputMode === 'file'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Image
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={clsx(
                'flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors',
                inputMode === 'url'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              disabled={isLoading}
            >
              <Link className="w-4 h-4 inline mr-2" />
              Use URL
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">{error}</div>
      )}
    </div>
  );
}