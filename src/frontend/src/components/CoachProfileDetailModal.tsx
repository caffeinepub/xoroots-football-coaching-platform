import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useGetCoachProfileDetail, useDeletePost, useDeleteJobPosting, useIsCallerAdmin, useFollowCoach, useUnfollowCoach, useIsFollowing, useGetAllProfiles, useDeleteUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { MapPin, Briefcase, Award, Heart, MessageCircle, Trash2, Calendar, UserPlus, UserCheck, Users, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AdminBadge from './AdminBadge';
import PostAttachmentRenderer from './PostAttachmentRenderer';
import type { Post, JobPost, Comment } from '../backend';

interface CoachProfileDetailModalProps {
  coachId: Principal | null;
  onClose: () => void;
}

export default function CoachProfileDetailModal({ coachId, onClose }: CoachProfileDetailModalProps) {
  const { identity } = useInternetIdentity();
  const { data: profileDetail, isLoading } = useGetCoachProfileDetail(coachId);
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: allProfiles = [] } = useGetAllProfiles();
  const { data: isFollowingCoach = false } = useIsFollowing(
    identity?.getPrincipal() || null,
    coachId
  );
  const followCoach = useFollowCoach();
  const unfollowCoach = useUnfollowCoach();
  const deletePost = useDeletePost();
  const deleteJob = useDeleteJobPosting();
  const deleteUser = useDeleteUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  const isCurrentUser = identity?.getPrincipal().toString() === coachId?.toString();

  const handleFollowToggle = () => {
    if (!coachId) return;
    if (isFollowingCoach) {
      unfollowCoach.mutate(coachId);
    } else {
      followCoach.mutate(coachId);
    }
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(postId);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job listing?')) {
      deleteJob.mutate(jobId);
    }
  };

  const handleDeleteAccount = () => {
    if (!coachId) return;
    deleteUser.mutate(coachId, {
      onSuccess: () => {
        setShowDeleteAccountDialog(false);
        onClose();
      },
    });
  };

  const getProfileByPrincipal = (principalId: Principal) => {
    return allProfiles.find((p) => p.userId.toString() === principalId.toString());
  };

  if (!coachId) return null;

  return (
    <>
      <Dialog open={!!coachId} onOpenChange={onClose}>
        <DialogContent 
          className="sm:max-w-[900px] max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-border dark:border-gray-700 shadow-2xl"
          style={{ backgroundColor: 'var(--background, #ffffff)' }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full min-h-[400px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : profileDetail ? (
            <>
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 flex-shrink-0">
                    {profileDetail.profile.photo && (
                      <AvatarImage
                        src={profileDetail.profile.photo.getDirectURL()}
                        alt={profileDetail.profile.name}
                      />
                    )}
                    <AvatarFallback className="text-2xl">
                      {profileDetail.profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-2xl text-gray-900 dark:text-white">{profileDetail.profile.name}</DialogTitle>
                      {profileDetail.isAdmin && <AdminBadge />}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{profileDetail.profile.specialty}</p>
                    {profileDetail.profile.location && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{profileDetail.profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <button
                        onClick={() => setShowFollowersList(!showFollowersList)}
                        className="text-sm hover:underline text-gray-900 dark:text-white"
                      >
                        <span className="font-semibold">{Number(profileDetail.followersCount)}</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">Followers</span>
                      </button>
                      <button
                        onClick={() => setShowFollowingList(!showFollowingList)}
                        className="text-sm hover:underline text-gray-900 dark:text-white"
                      >
                        <span className="font-semibold">{Number(profileDetail.followingCount)}</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">Following</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {!isCurrentUser && (
                        <Button
                          onClick={handleFollowToggle}
                          disabled={followCoach.isPending || unfollowCoach.isPending}
                          variant={isFollowingCoach ? 'outline' : 'default'}
                          size="sm"
                        >
                          {isFollowingCoach ? (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                      {isAdmin && !isCurrentUser && !profileDetail.isAdmin && (
                        <Button
                          onClick={() => setShowDeleteAccountDialog(true)}
                          variant="destructive"
                          size="sm"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 bg-white dark:bg-gray-900">
                <div className="py-4 space-y-4">
                  {showFollowersList && (
                    <Card className="bg-white dark:bg-gray-800 border-border dark:border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Users className="h-4 w-4" />
                            Followers
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowFollowersList(false)}>
                            Close
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[200px] overflow-y-auto">
                          {profileDetail.followers.length === 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No followers yet</p>
                          ) : (
                            <div className="space-y-2">
                              {profileDetail.followers.map((followerId) => {
                                const followerProfile = getProfileByPrincipal(followerId);
                                return (
                                  <div key={followerId.toString()} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      {followerProfile?.photo && (
                                        <AvatarImage src={followerProfile.photo.getDirectURL()} alt={followerProfile.name} />
                                      )}
                                      <AvatarFallback>
                                        {followerProfile?.name.charAt(0).toUpperCase() || 'C'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{followerProfile?.name || 'Coach'}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{followerProfile?.specialty || ''}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {showFollowingList && (
                    <Card className="bg-white dark:bg-gray-800 border-border dark:border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Users className="h-4 w-4" />
                            Following
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowFollowingList(false)}>
                            Close
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[200px] overflow-y-auto">
                          {profileDetail.following.length === 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Not following anyone yet</p>
                          ) : (
                            <div className="space-y-2">
                              {profileDetail.following.map((followingId) => {
                                const followingProfile = getProfileByPrincipal(followingId);
                                return (
                                  <div key={followingId.toString()} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      {followingProfile?.photo && (
                                        <AvatarImage src={followingProfile.photo.getDirectURL()} alt={followingProfile.name} />
                                      )}
                                      <AvatarFallback>
                                        {followingProfile?.name.charAt(0).toUpperCase() || 'C'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{followingProfile?.name || 'Coach'}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{followingProfile?.specialty || ''}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="posts">
                        Posts ({profileDetail.posts.length})
                      </TabsTrigger>
                      <TabsTrigger value="jobs">
                        Jobs ({profileDetail.jobs.length})
                      </TabsTrigger>
                      <TabsTrigger value="comments">
                        Comments ({profileDetail.comments.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 mt-4">
                      {profileDetail.profile.bio && (
                        <div>
                          <h4 className="mb-2 font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Briefcase className="h-4 w-4" />
                            Bio
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {profileDetail.profile.bio}
                          </p>
                        </div>
                      )}

                      <Separator className="dark:bg-gray-700" />

                      <div>
                        <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Experience</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {Number(profileDetail.profile.experience)} years of coaching experience
                        </p>
                      </div>

                      {profileDetail.profile.coachingRoles.length > 0 && (
                        <>
                          <Separator className="dark:bg-gray-700" />
                          <div>
                            <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Coaching Roles</h4>
                            <div className="flex flex-wrap gap-2">
                              {profileDetail.profile.coachingRoles.map((role, idx) => (
                                <Badge key={idx} variant="default">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {profileDetail.profile.positionsCoached.length > 0 && (
                        <>
                          <Separator className="dark:bg-gray-700" />
                          <div>
                            <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Positions Coached</h4>
                            <div className="flex flex-wrap gap-2">
                              {profileDetail.profile.positionsCoached.map((position, idx) => (
                                <Badge key={idx} variant="outline">
                                  {position}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {profileDetail.profile.certifications.length > 0 && (
                        <>
                          <Separator className="dark:bg-gray-700" />
                          <div>
                            <h4 className="mb-2 font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                              <Award className="h-4 w-4" />
                              Certifications
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {profileDetail.profile.certifications.map((cert, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="posts" className="space-y-4 mt-4">
                      {profileDetail.posts.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                          No posts yet
                        </div>
                      ) : (
                        profileDetail.posts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            isAdmin={isAdmin}
                            onDelete={() => handleDeletePost(post.id)}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="jobs" className="space-y-4 mt-4">
                      {profileDetail.jobs.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                          No job listings yet
                        </div>
                      ) : (
                        profileDetail.jobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            isAdmin={isAdmin}
                            onDelete={() => handleDeleteJob(job.id)}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4 mt-4">
                      {profileDetail.comments.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                          No comments yet
                        </div>
                      ) : (
                        profileDetail.comments.map((comment, idx) => (
                          <CommentCard key={idx} comment={comment} />
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full min-h-[400px] text-gray-600 dark:text-gray-400">
              Profile not found
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-border dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Delete User Account</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this user account? This action cannot be undone. All of their posts, job listings, and profile data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
  onDelete: () => void;
}

function PostCard({ post, isAdmin, onDelete }: PostCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-border dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="break-words">{formatDistanceToNow(Number(post.timestamp) / 1000000, { addSuffix: true })}</span>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white break-words">{post.content}</p>

        {post.attachments.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {post.attachments.map((attachment, idx) => (
              <PostAttachmentRenderer
                key={idx}
                attachment={attachment}
                className="h-32"
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {post.likes.length}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.comments.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface JobCardProps {
  job: JobPost;
  isAdmin: boolean;
  onDelete: () => void;
}

function JobCard({ job, isAdmin, onDelete }: JobCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-border dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white break-words">{job.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{job.schoolOrOrganization}</p>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{job.role}</Badge>
          <Badge variant="outline">{job.level}</Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="break-words">{job.location}</span>
        </div>
        {job.compensation && (
          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
            <strong>Compensation:</strong> {job.compensation}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDistanceToNow(Number(job.timestamp) / 1000000, { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

interface CommentCardProps {
  comment: Comment;
}

function CommentCard({ comment }: CommentCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-border dark:border-gray-700">
      <CardContent className="pt-4">
        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{formatDistanceToNow(Number(comment.timestamp) / 1000000, { addSuffix: true })}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white break-words">{comment.content}</p>
      </CardContent>
    </Card>
  );
}
