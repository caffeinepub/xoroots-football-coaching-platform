import type { ExternalBlob } from '../backend';

/**
 * Creates a displayable image URL from an ExternalBlob with fallback handling.
 * First tries the direct URL; if that fails to load, fetches bytes and creates a Blob URL.
 * Returns an object with the URL and a cleanup function to revoke Blob URLs.
 */
export async function createImageBlobUrl(
  externalBlob: ExternalBlob,
  onError?: () => void
): Promise<{ url: string; cleanup: () => void }> {
  const directUrl = externalBlob.getDirectURL();
  
  // Try direct URL first
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      // Direct URL works
      resolve({ url: directUrl, cleanup: () => {} });
    };
    
    img.onerror = async () => {
      // Direct URL failed, fetch bytes and create Blob URL
      try {
        const bytes = await externalBlob.getBytes();
        
        // Try to infer image MIME type from magic bytes
        let mimeType = 'image/jpeg'; // default
        if (bytes.length >= 4) {
          // PNG magic bytes: 89 50 4E 47
          if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            mimeType = 'image/png';
          }
          // GIF magic bytes: 47 49 46
          else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
            mimeType = 'image/gif';
          }
          // WebP magic bytes: 52 49 46 46 ... 57 45 42 50
          else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
              mimeType = 'image/webp';
            }
          }
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        
        resolve({
          url: blobUrl,
          cleanup: () => URL.revokeObjectURL(blobUrl)
        });
      } catch (error) {
        console.error('Failed to create image blob URL:', error);
        if (onError) onError();
        // Return direct URL as last resort
        resolve({ url: directUrl, cleanup: () => {} });
      }
    };
    
    img.src = directUrl;
  });
}

/**
 * React hook for managing image blob URLs with automatic cleanup
 */
export function useImageBlobUrl(externalBlob: ExternalBlob | null | undefined) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const cleanupRef = React.useRef<(() => void) | null>(null);
  
  React.useEffect(() => {
    if (!externalBlob) {
      setUrl(null);
      return;
    }
    
    setIsLoading(true);
    setError(false);
    
    createImageBlobUrl(externalBlob, () => setError(true))
      .then(({ url: newUrl, cleanup }) => {
        setUrl(newUrl);
        cleanupRef.current = cleanup;
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [externalBlob]);
  
  return { url, isLoading, error };
}

// Add React import for the hook
import React from 'react';
