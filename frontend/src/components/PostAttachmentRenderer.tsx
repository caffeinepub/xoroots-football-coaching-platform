import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Attachment } from '../backend';
import { isVideoAttachment, isPDFAttachment, isImageAttachment } from '../utils/attachmentTypes';
import { downloadAttachment } from '../utils/downloadAttachment';
import { ensureMimeType } from '../utils/blobMime';

interface PostAttachmentRendererProps {
  attachment: Attachment;
  className?: string;
}

export default function PostAttachmentRenderer({ attachment, className = '' }: PostAttachmentRendererProps) {
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const mimeType = ensureMimeType(attachment.mimeType, attachment.fileName);
  const fileName = attachment.fileName || 'attachment';
  const directUrl = attachment.blob.getDirectURL();

  // Determine attachment type using shared utilities
  const isImage = isImageAttachment(mimeType, fileName);
  const isVideo = isVideoAttachment(mimeType, fileName);
  const isPDF = isPDFAttachment(mimeType, fileName);

  // Handle image with fallback
  useEffect(() => {
    if (!isImage) return;

    setImageUrl(directUrl);
    setImageLoadError(false);

    return () => {
      // Cleanup any blob URLs created
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isImage, directUrl]);

  const handleImageError = async () => {
    if (imageLoadError) return; // Already tried fallback
    
    try {
      // Fallback: fetch bytes and create blob URL
      const bytes = await attachment.blob.getBytes();
      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setImageUrl(blobUrl);
      setImageLoadError(false);
    } catch (error) {
      console.error('Failed to load image:', error);
      setImageLoadError(true);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAttachment(attachment);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Render images inline with fallback
  if (isImage) {
    if (imageLoadError) {
      return (
        <div className={`rounded-lg border border-border dark:border-gray-700 p-4 bg-muted dark:bg-gray-800 ${className}`}>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Image (preview unavailable)</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <img
          src={imageUrl || directUrl}
          alt={fileName}
          className="w-full h-full object-contain bg-black/5 dark:bg-white/5"
          onError={handleImageError}
        />
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      </div>
    );
  }

  // Render videos inline with HTML5 video player
  if (isVideo) {
    return (
      <div className={`rounded-lg overflow-hidden bg-black relative ${className}`}>
        <video
          controls
          className="w-full h-full"
          preload="metadata"
        >
          <source src={directUrl} type={mimeType} />
          Your browser does not support the video tag.
        </video>
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      </div>
    );
  }

  // Render PDFs inline with iframe and fallback
  if (isPDF) {
    return (
      <div className={`rounded-lg overflow-hidden border border-border dark:border-gray-700 ${className}`}>
        {!pdfLoadError ? (
          <div className="relative w-full" style={{ minHeight: '500px' }}>
            <iframe
              src={`${directUrl}#view=FitH`}
              className="w-full h-full"
              style={{ minHeight: '500px' }}
              title={fileName}
              onError={() => setPdfLoadError(true)}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
              >
                <a href={directUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </a>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  PDF Document
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={directUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unknown file types - show file info with download button
  return (
    <div className={`rounded-lg border border-border dark:border-gray-700 p-4 bg-muted dark:bg-gray-800 ${className}`}>
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {mimeType === 'application/octet-stream' ? 'File' : mimeType}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={directUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </div>
    </div>
  );
}
