import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetFeedCategories, useCreatePost, useToggleLikePost, useAddComment, useDeletePost, useGetAllProfiles, useIsCallerAdmin, useDeleteComment, useToggleLikeComment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ExternalBlob } from '../backend';
import { Heart, MessageCircle, Trash2, Paperclip, Send, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Principal } from '@dfinity/principal';
import type { Post, Comment, Attachment } from '../backend';
import AdminBadge from './AdminBadge';
import CoachProfileDetailModal from './CoachProfileDetailModal';
import EditPostModal from './EditPostModal';
import PostAttachmentRenderer from './PostAttachmentRenderer';
import { useImageBlobUrl } from '../utils/imageBlobUrl';

type SortOption = 'newest' | 'mostLiked' | 'mostCommented' | 'notViewed';

const VIEWED_POSTS_KEY = 'xoroots_viewed_posts';

export default function SocialFeed() {
  const { identity } = useInternetIdentity();
  const { data: feedData, isLoading } = useGetFeedCategories();
  const { data: profiles = [] } = useGetAllProfiles();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const createPost = useCreatePost();
  const toggleLikePost = useToggleLikePost();
  const addComment = useAddComment();
  const deletePost = useDeletePost();
  const deleteComment = useDeleteComment();
  const toggleLikeComment = useToggleLikeComment();

  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [newPostContent, setNewPostContent] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const [selectedCoachId, setSelectedCoachId] = useState<Principal | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Load viewed posts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEWED_POSTS_KEY);
      if (stored) {
        setViewedPosts(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load viewed posts:', error);
    }
  }, []);

  // Save viewed posts to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify(Array.from(viewedPosts)));
    } catch (error) {
      console.error('Failed to save viewed posts:', error);
    }
  }, [viewedPosts]);

  // Mark posts as viewed when user interacts with them
  const markAsViewed = (postId: string) => {
    setViewedPosts((prev) => new Set(prev).add(postId));
  };

  const getProfileByPrincipal = (principalId: string) => {
    return profiles.find((p) => p.userId.toString() === principalId);
  };

  // Check if a user is an admin (for badge display)
  const isUserAdmin = (principalId: string) => {
    // For now, we'll need to check if the user is admin by comparing with current user
    // In a real implementation, you'd want to store admin status in the profile or fetch it separately
    return isAdmin && identity?.getPrincipal().toString() === principalId;
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && attachmentFiles.length === 0) return;

    const attachments: Attachment[] = [];
    for (const file of attachmentFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
      attachments.push({
        blob,
        mimeType: file.type || 'application/octet-stream',
        fileName: file.name,
      });
    }

    await createPost.mutateAsync({ content: newPostContent, attachments });
    setNewPostContent('');
    setAttachmentFiles([]);
  };

  const handleToggleLike = (postId: string) => {
    markAsViewed(postId);
    toggleLikePost.mutate(postId);
  };

  const handleComment = (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    markAsViewed(postId);
    addComment.mutate({ postId, content });
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const handleDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(postId);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate({ postId, commentId });
    }
  };

  const handleToggleLikeComment = (postId: string, commentId: string) => {
    toggleLikeComment.mutate({ postId, commentId });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachmentFiles(files);
  };

  const handleUsernameClick = (principalId: string) => {
    try {
      const principal = Principal.fromText(principalId);
      setSelectedCoachId(principal);
    } catch (error) {
      console.error('Invalid principal:', error);
    }
  };

  // Sort and filter posts based on selected option
  const sortPosts = (posts: Post[]): Post[] => {
    let filtered = [...posts];

    // Apply "Not Viewed" filter
    if (sortOption === 'notViewed') {
      filtered = filtered.filter((post) => !viewedPosts.has(post.id));
    }

    // Apply sorting
    switch (sortOption) {
      case 'mostLiked':
        return filtered.sort((a, b) => b.likes.length - a.likes.length);
      case 'mostCommented':
        return filtered.sort((a, b) => b.comments.length - a.comments.length);
      case 'newest':
      case 'notViewed':
      default:
        return filtered.sort((a, b) => Number(b.timestamp - a.timestamp));
    }
  };

  const forYouPosts = useMemo(() => {
    return sortPosts(feedData?.forYou || []);
  }, [feedData?.forYou, sortOption, viewedPosts]);

  const followingPosts = useMemo(() => {
    return sortPosts(feedData?.following || []);
  }, [feedData?.following, sortOption, viewedPosts]);

  const currentPosts = activeTab === 'forYou' ? forYouPosts : followingPosts;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle>Share an Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="post-attachments"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="post-attachments" className="cursor-pointer">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attach Files
                </label>
              </Button>
              {attachmentFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">{attachmentFiles.length} file(s) selected</span>
              )}
            </div>
            <Button onClick={handleCreatePost} disabled={createPost.isPending}>
              {createPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'forYou' | 'following')} className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="forYou" className="transition-all">
              For You
            </TabsTrigger>
            <TabsTrigger value="following" className="transition-all">
              Following
            </TabsTrigger>
          </TabsList>

          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="mostLiked">Most Liked</SelectItem>
              <SelectItem value="mostCommented">Most Commented</SelectItem>
              <SelectItem value="notViewed">Not Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="forYou" className="mt-6 space-y-6">
          {currentPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {sortOption === 'notViewed' 
                  ? "You've viewed all posts! Check back later for new content."
                  : 'No posts available. Connect with more coaches to see their updates!'}
              </CardContent>
            </Card>
          ) : (
            currentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorProfile={getProfileByPrincipal(post.author.toString())}
                isAuthor={identity?.getPrincipal().toString() === post.author.toString()}
                isAdmin={isAdmin}
                isAuthorAdmin={isUserAdmin(post.author.toString())}
                hasLiked={post.likes.some((p) => p.toString() === identity?.getPrincipal().toString())}
                commentInput={commentInputs[post.id] || ''}
                onToggleLike={() => handleToggleLike(post.id)}
                onComment={() => handleComment(post.id)}
                onDelete={() => handleDelete(post.id)}
                onEdit={() => handleEdit(post)}
                onCommentChange={(value) => setCommentInputs({ ...commentInputs, [post.id]: value })}
                onUsernameClick={handleUsernameClick}
                onDeleteComment={handleDeleteComment}
                onToggleLikeComment={handleToggleLikeComment}
                profiles={profiles}
                currentUserPrincipal={identity?.getPrincipal().toString() || ''}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-6 space-y-6">
          {currentPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {sortOption === 'notViewed' 
                  ? "You've viewed all posts from your connections!"
                  : 'No posts from your connections yet. Connect with coaches to see their updates here!'}
              </CardContent>
            </Card>
          ) : (
            currentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorProfile={getProfileByPrincipal(post.author.toString())}
                isAuthor={identity?.getPrincipal().toString() === post.author.toString()}
                isAdmin={isAdmin}
                isAuthorAdmin={isUserAdmin(post.author.toString())}
                hasLiked={post.likes.some((p) => p.toString() === identity?.getPrincipal().toString())}
                commentInput={commentInputs[post.id] || ''}
                onToggleLike={() => handleToggleLike(post.id)}
                onComment={() => handleComment(post.id)}
                onDelete={() => handleDelete(post.id)}
                onEdit={() => handleEdit(post)}
                onCommentChange={(value) => setCommentInputs({ ...commentInputs, [post.id]: value })}
                onUsernameClick={handleUsernameClick}
                onDeleteComment={handleDeleteComment}
                onToggleLikeComment={handleToggleLikeComment}
                profiles={profiles}
                currentUserPrincipal={identity?.getPrincipal().toString() || ''}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <CoachProfileDetailModal
        coachId={selectedCoachId}
        onClose={() => setSelectedCoachId(null)}
      />

      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />
    </div>
  );
}

interface PostCardProps {
  post: Post;
  authorProfile: any;
  isAuthor: boolean;
  isAdmin: boolean;
  isAuthorAdmin: boolean;
  hasLiked: boolean;
  commentInput: string;
  onToggleLike: () => void;
  onComment: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCommentChange: (value: string) => void;
  onUsernameClick: (principalId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleLikeComment: (postId: string, commentId: string) => void;
  profiles: any[];
  currentUserPrincipal: string;
}

function PostCard({
  post,
  authorProfile,
  isAuthor,
  isAdmin,
  isAuthorAdmin,
  hasLiked,
  commentInput,
  onToggleLike,
  onComment,
  onDelete,
  onEdit,
  onCommentChange,
  onUsernameClick,
  onDeleteComment,
  onToggleLikeComment,
  profiles,
  currentUserPrincipal,
}: PostCardProps) {
  const authorPhotoUrl = useImageBlobUrl(authorProfile?.photo);

  const getProfileByPrincipal = (principalId: string) => {
    return profiles.find((p) => p.userId.toString() === principalId);
  };

  // Check if comment author is admin (simplified - only checks current user)
  const isCommentAuthorAdmin = (commentAuthorId: string) => {
    return isAdmin && commentAuthorId === currentUserPrincipal;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              {authorPhotoUrl.url && (
                <AvatarImage src={authorPhotoUrl.url} alt={authorProfile?.name} />
              )}
              <AvatarFallback>
                {authorProfile?.name.charAt(0).toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUsernameClick(post.author.toString())}
                  className="font-semibold hover:underline"
                >
                  {authorProfile?.name || 'Coach'}
                </button>
                {isAuthorAdmin && <AdminBadge />}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(Number(post.timestamp) / 1000000, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthor && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {(isAuthor || isAdmin) && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{post.content}</p>

        {post.attachments.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {post.attachments.map((attachment, idx) => (
              <PostAttachmentRenderer
                key={idx}
                attachment={attachment}
                className="h-48"
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLike}
            className={hasLiked ? 'text-red-500' : ''}
          >
            <Heart className={`mr-2 h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
            {post.likes.length}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="mr-2 h-4 w-4" />
            {post.comments.length}
          </Button>
        </div>

        {post.comments.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            {post.comments.map((comment) => {
              const commentAuthor = getProfileByPrincipal(comment.author.toString());
              const commentIsAdmin = isCommentAuthorAdmin(comment.author.toString());
              const isCommentAuthor = comment.author.toString() === currentUserPrincipal;
              const hasLikedComment = comment.likes.some((p) => p.toString() === currentUserPrincipal);
              
              return (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  commentAuthor={commentAuthor}
                  commentIsAdmin={commentIsAdmin}
                  isCommentAuthor={isCommentAuthor}
                  hasLikedComment={hasLikedComment}
                  onToggleLike={() => onToggleLikeComment(post.id, comment.id)}
                  onDelete={() => onDeleteComment(post.id, comment.id)}
                />
              );
            })}
          </div>
        )}

        <div className="flex gap-2 border-t pt-4">
          <Input
            placeholder="Write a comment..."
            value={commentInput}
            onChange={(e) => onCommentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onComment();
              }
            }}
          />
          <Button size="icon" onClick={onComment}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CommentCardProps {
  comment: Comment;
  commentAuthor: any;
  commentIsAdmin: boolean;
  isCommentAuthor: boolean;
  hasLikedComment: boolean;
  onToggleLike: () => void;
  onDelete: () => void;
}

function CommentCard({
  comment,
  commentAuthor,
  commentIsAdmin,
  isCommentAuthor,
  hasLikedComment,
  onToggleLike,
  onDelete,
}: CommentCardProps) {
  const commentPhotoUrl = useImageBlobUrl(commentAuthor?.photo);

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        {commentPhotoUrl.url && (
          <AvatarImage src={commentPhotoUrl.url} alt={commentAuthor?.name} />
        )}
        <AvatarFallback>
          {commentAuthor?.name.charAt(0).toUpperCase() || 'C'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{commentAuthor?.name || 'Coach'}</span>
            {commentIsAdmin && <AdminBadge />}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(Number(comment.timestamp) / 1000000, { addSuffix: true })}
            </span>
          </div>
          {isCommentAuthor && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm">{comment.content}</p>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs ${hasLikedComment ? 'text-red-500' : ''}`}
          onClick={onToggleLike}
        >
          <Heart className={`mr-1 h-3 w-3 ${hasLikedComment ? 'fill-current' : ''}`} />
          {comment.likes.length > 0 && comment.likes.length}
        </Button>
      </div>
    </div>
  );
}
