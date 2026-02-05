import { FileText, Download, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Attachment } from '../backend';

interface PostAttachmentRendererProps {
  attachment: Attachment;
  className?: string;
}

export default function PostAttachmentRenderer({ attachment, className = '' }: PostAttachmentRendererProps) {
  const mimeType = attachment.mimeType || 'application/octet-stream';
  const fileName = attachment.fileName || 'attachment';
  const url = attachment.blob.getDirectURL();

  // Helper function to check if filename indicates an image
  const hasImageExtension = (name: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerName = name.toLowerCase();
    return imageExtensions.some(ext => lowerName.endsWith(ext));
  };

  // Determine attachment type
  const isImage = mimeType.startsWith('image/') || 
    (mimeType === 'application/octet-stream' && hasImageExtension(fileName)) ||
    (!mimeType && hasImageExtension(fileName));
  
  const isVideo = mimeType.startsWith('video/') || fileName.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|mkv)$/);
  const isPDF = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

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

  // Render videos as external open link (not inline player)
  if (isVideo) {
    return (
      <div className={`rounded-lg border border-border dark:border-gray-700 p-4 bg-muted dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-3">
          <Video className="h-8 w-8 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Video File</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Render PDFs as external open link
  if (isPDF) {
    return (
      <div className={`rounded-lg border border-border dark:border-gray-700 p-4 bg-muted dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">PDF Document</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
        </div>
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
