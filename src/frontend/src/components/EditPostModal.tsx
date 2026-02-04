import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePost } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Post, Attachment } from '../backend';
import { Paperclip, X } from 'lucide-react';
import PostAttachmentRenderer from './PostAttachmentRenderer';

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPostModal({ post, isOpen, onClose }: EditPostModalProps) {
  const [content, setContent] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [hasModifiedAttachments, setHasModifiedAttachments] = useState(false);
  const updatePost = useUpdatePost();

  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content);
      setExistingAttachments(post.attachments);
      setAttachmentFiles([]);
      setHasModifiedAttachments(false);
    }
  }, [post, isOpen]);

  const handleSave = async () => {
    if (!post) return;

    let finalAttachments: Attachment[] = [];

    // If user has modified attachments (removed or added new ones), use the modified state
    if (hasModifiedAttachments) {
      // Start with remaining existing attachments
      finalAttachments = [...existingAttachments];
      
      // Add new files
      for (const file of attachmentFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
        finalAttachments.push({
          blob,
          mimeType: file.type || 'application/octet-stream',
          fileName: file.name,
        });
      }
    } else {
      // No modifications, keep original attachments
      finalAttachments = post.attachments;
    }

    await updatePost.mutateAsync({
      postId: post.id,
      content,
      attachments: finalAttachments,
    });

    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachmentFiles(files);
    setHasModifiedAttachments(true);
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    setHasModifiedAttachments(true);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 text-foreground dark:text-white backdrop-blur-none border-2 border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-white">Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block text-foreground dark:text-white">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="What's on your mind?"
              className="bg-white dark:bg-gray-800 text-foreground dark:text-white border-input dark:border-gray-700"
            />
          </div>

          {existingAttachments.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block text-foreground dark:text-white">Current Attachments</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {existingAttachments.map((attachment, idx) => (
                  <div key={idx} className="relative">
                    <PostAttachmentRenderer
                      attachment={attachment}
                      className="h-32"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveExistingAttachment(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block text-foreground dark:text-white">Add New Attachments</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*,video/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="edit-post-attachments"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="edit-post-attachments" className="cursor-pointer">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Files
                </label>
              </Button>
              {attachmentFiles.length > 0 && (
                <span className="text-sm text-muted-foreground dark:text-gray-400">{attachmentFiles.length} new file(s) selected</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={updatePost.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updatePost.isPending}>
            {updatePost.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
