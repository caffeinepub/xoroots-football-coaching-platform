import { useState } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Attachment } from '../backend';
import { isVideoAttachment, isPDFAttachment, isImageAttachment } from '../utils/attachmentTypes';

interface PostAttachmentRendererProps {
  attachment: Attachment;
  className?: string;
}

export default function PostAttachmentRenderer({ attachment, className = '' }: PostAttachmentRendererProps) {
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const mimeType = attachment.mimeType || 'application/octet-stream';
  const fileName = attachment.fileName || 'attachment';
  const url = attachment.blob.getDirectURL();

  // Determine attachment type using shared utilities
  const isImage = isImageAttachment(mimeType, fileName);
  const isVideo = isVideoAttachment(mimeType, fileName);
  const isPDF = isPDFAttachment(mimeType, fileName);

  // Render images inline
  if (isImage) {
    return (
      <img
        src={url}
        alt={fileName}
        className={`rounded-lg object-cover w-full ${className}`}
      />
    );
  }

  // Render videos inline with HTML5 video player
  if (isVideo) {
    return (
      <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
        <video
          controls
          className="w-full h-full"
          preload="metadata"
        >
          <source src={url} type={mimeType} />
          Your browser does not support the video tag.
        </video>
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
              src={url}
              className="w-full h-full"
              style={{ minHeight: '500px' }}
              title={fileName}
              onError={() => setPdfLoadError(true)}
            />
            <div className="absolute top-2 right-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </a>
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
                  PDF Document (inline viewing not supported by browser)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unknown file types - external download link
  return (
    <div className={`rounded-lg border border-border dark:border-gray-700 p-4 bg-muted dark:bg-gray-800 ${className}`}>
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">File</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
