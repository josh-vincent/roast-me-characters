# UX & Error Handling Improvements

## Priority 1: Critical Issues

### 1. Enhanced Retry Logic for AI Generation
**File**: `packages/ai/src/index.ts`

```typescript
// Add intelligent retry with different prompts
async function generateWithRetry(
  func: () => Promise<any>,
  maxRetries: number = 3,
  context: { attemptNumber: number, lastError?: Error }
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      context.lastError = error;
      context.attemptNumber = i + 1;
      
      // Different strategies based on error type
      if (error.message.includes('timeout')) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      } else if (error.message.includes('rate limit')) {
        await new Promise(r => setTimeout(r, 5000 * (i + 1)));
      } else {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw context.lastError;
}
```

### 2. User-Visible Generation Status
**File**: `apps/web/src/app/generate/[id]/generation-tracker.tsx`

Add real-time status updates:
```typescript
const STATUS_MESSAGES = {
  analyzing: ['Detecting features...', 'Analyzing facial characteristics...', 'Processing image data...'],
  roasting: ['Writing savage jokes...', 'Crafting the perfect roast...', 'Adding comedic touches...'],
  creating: ['Generating caricature...', 'Exaggerating features...', 'Adding final details...'],
  finalizing: ['Polishing your character...', 'Almost ready...', 'Saving to gallery...']
};

// Rotate messages every 3 seconds to show progress
useEffect(() => {
  const interval = setInterval(() => {
    setStatusMessage(prev => {
      const messages = STATUS_MESSAGES[generationStep];
      const currentIndex = messages.indexOf(prev);
      return messages[(currentIndex + 1) % messages.length];
    });
  }, 3000);
  return () => clearInterval(interval);
}, [generationStep]);
```

### 3. Pre-Upload Credit Check
**File**: `apps/web/src/app/components/CharacterUploadSection.tsx`

```typescript
// Check credits before allowing upload
const [canUpload, setCanUpload] = useState(true);

useEffect(() => {
  if (user) {
    getCredits().then(credits => {
      setCanUpload(credits > 0);
      if (credits <= 0) {
        toast.warning('No credits remaining', {
          description: 'Purchase credits to create characters',
          action: {
            label: 'Get Credits',
            onClick: () => router.push('/credits')
          }
        });
      }
    });
  }
}, [user]);
```

## Priority 2: Enhanced Error Recovery

### 1. Auto-Retry for Transient Failures
**File**: `apps/web/src/app/actions/character-actions.ts`

```typescript
export async function generateCharacterWithAutoRetry(formData: FormData): Promise<CharacterGenerationResult> {
  let lastError: Error | null = null;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateCharacter(formData);
      
      // If it's a transient error, retry automatically
      if (!result.success && isTransientError(result.error)) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries && isTransientError(error)) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      break;
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Generation failed after multiple attempts'
  };
}

function isTransientError(error: any): boolean {
  const transientMessages = ['timeout', 'network', 'rate limit', '503', '502', '429'];
  const errorStr = typeof error === 'string' ? error : error?.message || '';
  return transientMessages.some(msg => errorStr.toLowerCase().includes(msg));
}
```

### 2. Progressive Image Loading with Fallback
**File**: `apps/web/src/components/SafeImage.tsx` (new file)

```typescript
import { useState } from 'react';
import Image from 'next/image';

export function SafeImage({ src, fallbackSrc, alt, ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleError = () => {
    if (retryCount < 3) {
      // Retry with delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentSrc(src + '?retry=' + (retryCount + 1));
      }, 1000 * (retryCount + 1));
    } else if (fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };
  
  return (
    <>
      {isLoading && <div className="skeleton-loader" />}
      <Image
        {...props}
        src={currentSrc}
        alt={alt}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}
```

## Priority 3: Better Error Messages

### 1. Contextual Error Messages
**File**: `apps/web/src/app/actions/character-actions.ts`

```typescript
const ERROR_MESSAGES = {
  'quota_exceeded': {
    message: 'AI service quota exceeded',
    action: 'Please try again in a few minutes',
    recoverable: true
  },
  'invalid_image': {
    message: 'Image format not supported',
    action: 'Please upload a JPG, PNG, or WebP image',
    recoverable: false
  },
  'timeout': {
    message: 'Generation is taking longer than expected',
    action: 'Your character is still being created. Check back in a moment.',
    recoverable: true
  },
  'auth_required': {
    message: 'Sign in required',
    action: 'Sign in to continue creating characters',
    recoverable: false
  }
};

function getErrorMessage(error: any): {message: string, action: string, recoverable: boolean} {
  const errorStr = error?.message || error || '';
  
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorStr.includes(key)) {
      return value;
    }
  }
  
  return {
    message: 'Something went wrong',
    action: 'Please try again',
    recoverable: true
  };
}
```

### 2. Toast Notifications with Actions
**File**: `apps/web/src/app/components/CharacterUploadSection.tsx`

```typescript
// Enhanced error handling with recovery options
const handleError = (error: any) => {
  const errorInfo = getErrorMessage(error);
  
  toast.error(errorInfo.message, {
    description: errorInfo.action,
    action: errorInfo.recoverable ? {
      label: 'Retry',
      onClick: () => handleUpload(lastFile)
    } : undefined,
    duration: errorInfo.recoverable ? 10000 : 5000
  });
};
```

## Priority 4: Performance Optimizations

### 1. Optimistic Updates
- Show immediate UI feedback before server confirmation
- Update gallery with placeholder while image generates
- Cache successful generations locally

### 2. Progressive Enhancement
- Load low-res thumbnails first, then high-res
- Lazy load gallery images as user scrolls
- Preload next likely actions (e.g., credit purchase page)

### 3. Background Queue System
- Implement job queue for generation tasks
- Allow users to queue multiple generations
- Send email/notification when complete

## Implementation Order

1. **Week 1**: Fix critical error handling in AI generation pipeline
2. **Week 2**: Add auto-retry logic and better error messages
3. **Week 3**: Implement progressive loading and optimistic updates
4. **Week 4**: Add background queue system for better scalability

## Monitoring & Analytics

Add tracking for:
- Generation failure rates by type
- Retry success rates
- Time to generation completion
- User drop-off points in the flow
- Credit purchase conversion after errors