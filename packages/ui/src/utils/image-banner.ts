/**
 * Utility functions for adding branded banner to images for sharing/download
 */

export async function addBannerToImage(
  imageUrl: string, 
  bannerText: string = 'roastme.tocld.com'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS for external images
    
    img.onload = () => {
      try {
        // Set canvas dimensions based on image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Banner configuration
        const bannerHeight = Math.max(40, img.height * 0.06); // 6% of image height, min 40px
        const fontSize = Math.max(14, bannerHeight * 0.4); // 40% of banner height
        
        // Draw banner background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, bannerHeight);
        
        // Add subtle gradient for better visual appeal
        const gradient = ctx.createLinearGradient(0, 0, 0, bannerHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, bannerHeight);
        
        // Configure text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw the banner text
        ctx.fillText(bannerText, canvas.width / 2, bannerHeight / 2);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(dataUrl);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

export async function downloadImageWithBanner(
  imageUrl: string, 
  filename: string = 'roast-character.png',
  bannerText: string = 'roastme.tocld.com'
): Promise<void> {
  try {
    const imageWithBanner = await addBannerToImage(imageUrl, bannerText);
    
    // Create download link
    const link = document.createElement('a');
    link.href = imageWithBanner;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Failed to download image with banner:', error);
    // Fallback to original image download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export async function shareImageWithBanner(
  imageUrl: string,
  title: string = 'Check out my AI Roast Character!',
  text: string = 'Created at roastme.tocld.com',
  bannerText: string = 'roastme.tocld.com'
): Promise<void> {
  try {
    if (navigator.share && navigator.canShare) {
      // For platforms that support native sharing with images
      const imageWithBanner = await addBannerToImage(imageUrl, bannerText);
      
      // Convert data URL to blob
      const response = await fetch(imageWithBanner);
      const blob = await response.blob();
      const file = new File([blob], 'roast-character.png', { type: 'image/png' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file]
        });
        return;
      }
    }
    
    // Fallback: copy URL to clipboard and show message
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard! Share this URL to show your roast character.');
    } else {
      // Further fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard! Share this URL to show your roast character.');
    }
    
  } catch (error) {
    console.error('Failed to share image:', error);
    // Ultimate fallback: just copy URL
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    alert('Link copied to clipboard! Share this URL to show your roast character.');
  }
}

export async function shareCharacterUrl(
  urlOrSlug?: string,
  title: string = 'Check out my AI Roast Character!',
  showSuccessMessage: boolean = true
): Promise<void> {
  try {
    // If it's already a full URL (contains http/https), use it directly
    // Otherwise, construct the character URL from slug
    let url: string;
    if (!urlOrSlug) {
      url = window.location.href;
    } else if (urlOrSlug.startsWith('http://') || urlOrSlug.startsWith('https://')) {
      url = urlOrSlug;
    } else {
      const baseUrl = window.location.origin;
      url = `${baseUrl}/character/${encodeURIComponent(urlOrSlug)}`;
    }
    
    if (navigator.share && navigator.canShare({ url })) {
      // Use native sharing if available
      await navigator.share({
        title,
        url,
      });
      return;
    }
    
    // Fallback: copy URL to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    } else {
      // Further fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    if (showSuccessMessage) {
      // Show a more subtle success message
      const message = 'Link copied to clipboard! 🔗';
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(message);
      } else {
        // Create a temporary toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #059669;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 500;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 3000);
      }
    }
    
  } catch (error) {
    console.error('Failed to share character URL:', error);
    // Ultimate fallback
    if (showSuccessMessage) {
      alert('Unable to copy link. Please copy the URL from your browser.');
    }
  }
}