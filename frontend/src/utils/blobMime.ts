/**
 * Infers MIME type from filename extension.
 * Returns a sensible MIME type or null if unknown.
 */
export function inferMimeType(fileName: string): string | null {
  if (!fileName) return null;
  
  const ext = fileName.toLowerCase().split('.').pop();
  if (!ext) return null;
  
  const mimeMap: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  
  return mimeMap[ext] || null;
}

/**
 * Ensures a MIME type is valid for the given filename.
 * If mimeType is missing or generic, tries to infer from filename.
 */
export function ensureMimeType(mimeType: string | undefined, fileName: string): string {
  if (mimeType && mimeType !== 'application/octet-stream') {
    return mimeType;
  }
  
  return inferMimeType(fileName) || 'application/octet-stream';
}
