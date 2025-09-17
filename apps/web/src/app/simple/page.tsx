'use client';

import { useState } from 'react';
import { ImageUploadWithUrl, LoadingSpinner, Button } from '@roast-me/ui';
import { analyzeImageSimple } from '../actions/analyze-image-simple';

export default function SimplePage() {
  const [uploadedSource, setUploadedSource] = useState<File | string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (source: File | string) => {
    setUploadedSource(source);
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (source instanceof File) {
        formData.append('file', source);
      } else {
        formData.append('imageUrl', source);
      }
      
      const result = await analyzeImageSimple(formData);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setAnalysisResult(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">
          Roast Me Characters
        </h1>
        <p className="text-center text-xl mb-12 text-gray-600">
          Upload an image and watch AI transform it into character features
        </p>
        
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Your Photo or Enter URL</h2>
          <ImageUploadWithUrl onUpload={handleUpload} isLoading={isProcessing} />
          
          {isProcessing && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <LoadingSpinner size="md" />
              <p className="text-gray-600">Analyzing your image with AI...</p>
              <p className="text-sm text-gray-500">This may take a few seconds...</p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}
          
          {uploadedSource && !isProcessing && !error && !analysisResult && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">
                ✅ {typeof uploadedSource === 'string' ? 'URL' : uploadedSource.name} ready for processing
              </p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {analysisResult?.success && (
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-4">AI Analysis Results</h3>
              
              {analysisResult.analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Character Style</p>
                      <p className="text-lg capitalize">{analysisResult.analysis.character_style}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Dominant Color</p>
                      <p className="text-lg">{analysisResult.analysis.dominant_color}</p>
                    </div>
                  </div>
                  
                  {analysisResult.analysis.personality_traits && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900 mb-2">Personality Traits</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.personality_traits.map((trait: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-yellow-100 rounded-full text-sm">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detected Features */}
            {analysisResult.features && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-semibold mb-4">Detected Features for 3D Exaggeration</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysisResult.features.map((feature: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{feature.feature_name}</h4>
                        <span className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded">
                          {feature.exaggeration_factor}/10
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{feature.feature_value}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${feature.exaggeration_factor * 10}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {Math.round((feature.confidence || 0) * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D Parameters */}
            {analysisResult.params && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-semibold mb-4">3D Character Parameters</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(analysisResult.params).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}