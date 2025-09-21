export interface ErrorInfo {
  message: string;
  action: string;
  recoverable: boolean;
  retryDelay?: number;
}

const ERROR_PATTERNS: Record<string, ErrorInfo> = {
  // Authentication errors
  'auth_required': {
    message: 'Sign in required',
    action: 'Please sign in to continue creating characters',
    recoverable: false
  },
  'invalid_credentials': {
    message: 'Authentication failed',
    action: 'Please try signing in again',
    recoverable: false
  },
  
  // Credit errors
  'insufficient_credits': {
    message: 'Not enough credits',
    action: 'Purchase more credits to continue',
    recoverable: false
  },
  'quota_exceeded': {
    message: 'AI service quota exceeded',
    action: 'Please try again in a few minutes',
    recoverable: true,
    retryDelay: 60000
  },
  
  // Image errors
  'invalid_image': {
    message: 'Image format not supported',
    action: 'Please upload a JPG, PNG, or WebP image under 10MB',
    recoverable: false
  },
  'image_too_large': {
    message: 'Image file is too large',
    action: 'Please upload an image under 10MB',
    recoverable: false
  },
  'no_face_detected': {
    message: 'No face detected in image',
    action: 'Please upload a clear photo with a visible face',
    recoverable: false
  },
  
  // Network errors
  'timeout': {
    message: 'Request timed out',
    action: 'The server is taking longer than expected. Please wait or try again.',
    recoverable: true,
    retryDelay: 5000
  },
  'network_error': {
    message: 'Network connection issue',
    action: 'Please check your internet connection and try again',
    recoverable: true,
    retryDelay: 3000
  },
  
  // Server errors
  '500': {
    message: 'Server error',
    action: 'Our servers encountered an issue. Please try again.',
    recoverable: true,
    retryDelay: 5000
  },
  '502': {
    message: 'Service temporarily unavailable',
    action: 'The service is temporarily down. Please try again in a moment.',
    recoverable: true,
    retryDelay: 10000
  },
  '503': {
    message: 'Service overloaded',
    action: 'Our service is experiencing high demand. Please try again shortly.',
    recoverable: true,
    retryDelay: 15000
  },
  '429': {
    message: 'Too many requests',
    action: 'You\'re making requests too quickly. Please wait a moment.',
    recoverable: true,
    retryDelay: 30000
  },
  
  // AI Generation errors
  'generation_failed': {
    message: 'Character generation failed',
    action: 'The AI couldn\'t generate your character. Please try with a different image.',
    recoverable: true,
    retryDelay: 5000
  },
  'content_policy': {
    message: 'Content policy violation',
    action: 'The image may violate content policies. Please try a different image.',
    recoverable: false
  },
  'rate_limit': {
    message: 'AI rate limit reached',
    action: 'We\'ve hit our AI usage limit. Please try again in a few minutes.',
    recoverable: true,
    retryDelay: 60000
  }
};

// Default error for unknown issues
const DEFAULT_ERROR: ErrorInfo = {
  message: 'Something went wrong',
  action: 'An unexpected error occurred. Please try again.',
  recoverable: true,
  retryDelay: 3000
};

/**
 * Get user-friendly error information based on the error
 */
export function getErrorInfo(error: any): ErrorInfo {
  if (!error) return DEFAULT_ERROR;
  
  const errorStr = typeof error === 'string' 
    ? error.toLowerCase() 
    : (error?.message || error?.code || '').toString().toLowerCase();
  
  // Check for exact status codes first
  if (error?.status) {
    const statusKey = error.status.toString();
    if (ERROR_PATTERNS[statusKey]) {
      return ERROR_PATTERNS[statusKey];
    }
  }
  
  // Check for pattern matches
  for (const [pattern, info] of Object.entries(ERROR_PATTERNS)) {
    if (errorStr.includes(pattern.toLowerCase()) || 
        errorStr.includes(pattern.replace(/_/g, ' '))) {
      return info;
    }
  }
  
  // Check for common error types
  if (errorStr.includes('network') || errorStr.includes('fetch')) {
    return ERROR_PATTERNS.network_error;
  }
  
  if (errorStr.includes('timeout')) {
    return ERROR_PATTERNS.timeout;
  }
  
  if (errorStr.includes('rate') || errorStr.includes('limit')) {
    return ERROR_PATTERNS.rate_limit;
  }
  
  return DEFAULT_ERROR;
}

/**
 * Check if an error is recoverable (can be retried)
 */
export function isRecoverableError(error: any): boolean {
  const errorInfo = getErrorInfo(error);
  return errorInfo.recoverable;
}

/**
 * Get recommended retry delay for an error
 */
export function getRetryDelay(error: any): number {
  const errorInfo = getErrorInfo(error);
  return errorInfo.retryDelay || 3000;
}

/**
 * Format error for display in toast notification
 */
export function formatErrorForToast(error: any) {
  const errorInfo = getErrorInfo(error);
  return {
    title: errorInfo.message,
    description: errorInfo.action,
    duration: errorInfo.recoverable ? 10000 : 5000,
    recoverable: errorInfo.recoverable
  };
}