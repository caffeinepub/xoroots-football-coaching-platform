// Shared attachment type detection utilities

export function isVideoAttachment(mimeType: string, fileName: string): boolean {
  return (
    mimeType.startsWith('video/') ||
    fileName.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|mkv)$/) !== null
  );
}

export function isPDFAttachment(mimeType: string, fileName: string): boolean {
  return mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
}

export function isImageAttachment(mimeType: string, fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerName = fileName.toLowerCase();
  return (
    mimeType.startsWith('image/') ||
    (mimeType === 'application/octet-stream' && imageExtensions.some(ext => lowerName.endsWith(ext))) ||
    (!mimeType && imageExtensions.some(ext => lowerName.endsWith(ext)))
  );
}
