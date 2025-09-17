'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploadWithUrl } from '@roast-me/ui';
import { generateDirectly } from '../actions/generate-direct';

type WorkflowStep = 'upload' | 'generate';

export function CharacterUploadSection() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleUpload = async (source: File | string) => {
    setCurrentStep('generate');
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (source instanceof File) {
        formData.append('file', source);
      } else {
        formData.append('imageUrl', source);
      }
      
      const result = await generateDirectly(formData);
      
      if ('error' in result && result.error) {
        setError(result.error);
        setCurrentStep('upload');
      } else if (result.success && result.seoSlug) {
        // Redirect to character page immediately
        router.push(`/character/${encodeURIComponent(result.seoSlug)}`);
        return;
      } else {
        setError('Character generation failed');
        setCurrentStep('upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate character');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {currentStep === 'upload' ? (
        <div className="max-w-4xl mx-auto">
          {/* Upload Card */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border border-gray-200 overflow-hidden">
            <div className="p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Start creating</h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Upload a photo to get hilariously roasted with a caricature figurine featuring your most exaggerated traits!
                </p>
              </div>
              
              <ImageUploadWithUrl onUpload={handleUpload} isLoading={isProcessing} />
              
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 font-medium">{error}</p>
                      <button 
                        onClick={() => setError(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                      >
                        Try again →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : currentStep === 'generate' ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 rounded-full mb-8">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-4 h-4 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Creating your roast</h2>
              <p className="text-xl text-gray-600 mb-6">Our AI is hilariously exaggerating your features</p>
              
              <div className="max-w-md mx-auto mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm text-purple-600 font-medium">Working...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Analyzing</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Generating</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Complete</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">This usually takes 15-30 seconds</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}