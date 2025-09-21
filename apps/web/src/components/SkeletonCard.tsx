'use client';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-300/50 to-transparent" />
        
        {/* Badge skeletons */}
        <div className="absolute top-2 left-2 flex gap-2">
          <div className="h-6 w-20 bg-gray-300 rounded-full" />
          <div className="h-6 w-16 bg-gray-300 rounded-full" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded-md mb-2 w-3/4" />
        
        {/* Punchline skeleton */}
        <div className="space-y-1.5 mb-3">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
        
        {/* Features skeleton */}
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-18 bg-gray-200 rounded-full" />
        </div>
        
        {/* Actions skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}