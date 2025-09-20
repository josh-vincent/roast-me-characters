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
          {/* Mode Switcher */}
          <div className="flex rounded-lg overflow-hidden mb-4 border border-gray-200">
            <button
              onClick={() => setInputMode('file')}
              className={clsx(
                'flex-1 py-2 px-4 text-sm font-medium transition-colors',
                inputMode === 'file'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={clsx(
                'flex-1 py-2 px-4 text-sm font-medium transition-colors',
                inputMode === 'url'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
              disabled={isLoading}
            >
              <Link className="w-4 h-4 inline mr-2" />
              Image URL
            </button>
          </div>

          {inputMode === 'file' ? (
            <label
              className={clsx(
                'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isDragging ? (
                  <ImageIcon className="w-12 h-12 mb-3 text-blue-500" />
                ) : (
                  <Upload className="w-12 h-12 mb-3 text-gray-400" />
                )}
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP, or HEIC (MAX. {maxSize / 1024 / 1024}MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                disabled={isLoading}
                multiple={false}
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="image-url" className="text-sm font-medium text-gray-700">
                  Enter Image URL
                </label>
                <div className="flex space-x-2">
                  <input
                    id="image-url"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrl()}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleUrl}
                    disabled={isLoading || !urlInput.trim()}
                    className={clsx(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      isLoading || !urlInput.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">Try these examples:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-sm mx-auto">
                  <button
                    onClick={() => setUrlInput('https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=400')}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all duration-200"
                  >
                    <img 
                      src="https://m.media-amazon.com/images/M/MV5BZjA3NzZiZDktZjc2My00MzY2LThhOWMtZGFjYzg4ZDI2ZWVmXkEyXkFqcGc@._V1_FMjpg_UX1080_.jpg" 
                      alt="Johnny Depp style" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
                      <div className="w-full bg-gradient-to-t from-black to-transparent p-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Johnny Depp
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setUrlInput('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400')}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all duration-200"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" 
                      alt="Elon Musk style" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
                      <div className="w-full bg-gradient-to-t from-black to-transparent p-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Elon Musk
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setUrlInput('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400')}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all duration-200"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" 
                      alt="Britney Spears style" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
                      <div className="w-full bg-gradient-to-t from-black to-transparent p-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Britney Spears
                      </div>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click any image to use as an example</p>
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">{error}</div>
      )}
    </div>
  );
}