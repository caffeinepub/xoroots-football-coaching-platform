import type { Attachment } from '../backend';
import { inferMimeType } from './blobMime';

/**
 * Downloads an attachment by fetching bytes from blob storage,
 * creating a Blob with the correct MIME type, and triggering a browser download
 * with the original filename.
 */
export async function downloadAttachment(attachment: Attachment): Promise<void> {
  try {
    // Fetch the bytes from blob storage
    const bytes = await attachment.blob.getBytes();
    
    // Determine the MIME type (use stored type or infer from filename)
    const mimeType = attachment.mimeType && attachment.mimeType !== 'application/octet-stream'
      ? attachment.mimeType
      : inferMimeType(attachment.fileName) || 'application/octet-stream';
    
    // Create a Blob with the correct MIME type
    const blob = new Blob([bytes], { type: mimeType });
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download attachment:', error);
    throw error;
  }
}
