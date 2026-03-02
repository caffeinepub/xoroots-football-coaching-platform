import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { CoachProfile, Post, JobPost, DirectMessage, GroupMessage, Application, CoachProfileDetail, Attachment } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  const query = useQuery<CoachProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch (error: any) {
        console.error('[Profile Query] Error fetching profile:', error);
        if (error.message?.includes('Unauthorized') || error.message?.includes('Only users')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !isInitializing,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return {
    ...query,
    isLoading: actorFetching || isInitializing || query.isLoading,
    isFetched: !!actor && !isInitializing && query.isFetched,
  };
}

export function useInitializeCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const profile = await actor.initializeCallerProfile();
      return profile;
    },
    onSuccess: async (profile) => {
      if (profile) {
        queryClient.setQueryData(['currentUserProfile'], profile);
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['allProfiles'] }),
        queryClient.invalidateQueries({ queryKey: ['coachCount'] }),
      ]);
    },
    onError: (error: Error) => {
      console.error('[Profile Init] Failed to initialize profile:', error);
      toast.error('Failed to initialize profile. Please try logging in again.');
    },
  });
}

export function useGetCoachPhoto(coachId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<ExternalBlob | null>({
    queryKey: ['coachPhoto', coachId?.toString()],
    queryFn: async () => {
      if (!actor || !coachId) return null;
      try {
        return await actor.getCoachPhoto(coachId);
      } catch (error) {
        console.error('Failed to fetch coach photo:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!coachId,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: CoachProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['coachPhoto', variables.userId.toString()] });
      await queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      await queryClient.invalidateQueries({ queryKey: ['coachCount'] });
      
      await queryClient.refetchQueries({ queryKey: ['coachPhoto', variables.userId.toString()] });
      
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useGetAllProfiles() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<CoachProfile[]>({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllProfiles();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 1000 * 60 * 2,
  });
}

export function useGetCoachCount() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['coachCount'],
    queryFn: async () => {
      if (!actor) return 0;
      try {
        const count = await actor.getCoachCount();
        return Number(count);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return 0;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 1000 * 60 * 2,
  });
}

export function useGetProfile(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<CoachProfile | null>({
    queryKey: ['profile', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return await actor.getProfile(userId);
    },
    enabled: !!actor && !isFetching && !isInitializing && !!userId,
  });
}

export function useGetCoachProfileDetail(coachId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<CoachProfileDetail | null>({
    queryKey: ['coachProfileDetail', coachId?.toString()],
    queryFn: async () => {
      if (!actor || !coachId) return null;
      try {
        return await actor.getCoachProfileDetail(coachId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!coachId,
    staleTime: 1000 * 30,
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      experience: bigint;
      specialty: string;
      certifications: string[];
      photo: ExternalBlob | undefined;
      bio: string;
      positionsCoached: string[];
      location: string;
      coachingRoles: string[];
      userId: Principal;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateProfile(
        params.name,
        params.experience,
        params.specialty,
        params.certifications,
        params.photo || null,
        params.bio,
        params.positionsCoached,
        params.location,
        params.coachingRoles
      );
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['coachPhoto', variables.userId.toString()] });
      await queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      await queryClient.invalidateQueries({ queryKey: ['coachProfileDetail', variables.userId.toString()] });
      
      await queryClient.refetchQueries({ queryKey: ['coachPhoto', variables.userId.toString()] });
      
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHasNewBannerNotification() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['hasNewBannerNotification'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.hasNewBannerNotification();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useDismissBannerNotification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.dismissBannerNotification();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hasNewBannerNotification'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to dismiss notification: ${error.message}`);
    },
  });
}

export function useSubmitReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.submitReport();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hasNewBannerNotification'] });
      toast.success('Report submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit report: ${error.message}`);
    },
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteUser(targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['coachCount'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      toast.success('User account deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
}

// Social Feed Queries
export function useGetFeed() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ['socialFeed'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getFeed();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 1000 * 30,
  });
}

export function useGetFeedCategories() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<{ forYou: Post[]; following: Post[] }>({
    queryKey: ['feedCategories'],
    queryFn: async () => {
      if (!actor) return { forYou: [], following: [] };
      try {
        return await actor.getFeedCategories();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return { forYou: [], following: [] };
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 1000 * 30,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { content: string; attachments: Attachment[] }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createPost(params.content, params.attachments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Post created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });
}

export function useUpdatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; content: string; attachments: Attachment[] }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePost(params.postId, params.content, params.attachments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Post updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update post: ${error.message}`);
    },
  });
}

export function useToggleLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      const isNowLiked = await actor.toggleLikePost(postId);
      return { postId, isNowLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle like: ${error.message}`);
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addComment(params.postId, params.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Comment added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteComment(params.postId, params.commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });
}

export function useToggleLikeComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      const isNowLiked = await actor.toggleLikeComment(params.postId, params.commentId);
      return { postId: params.postId, commentId: params.commentId, isNowLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle comment like: ${error.message}`);
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Post deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}

export function useMarkPostViewed() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markPostViewed(postId);
    },
  });
}

export function useMarkPostsViewed() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postIds: string[]) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markPostsViewed(postIds);
    },
  });
}

// Follow System Queries
export function useFollowCoach() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coachId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.followCoach(coachId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      toast.success('Now following coach');
    },
    onError: (error: Error) => {
      toast.error(`Failed to follow: ${error.message}`);
    },
  });
}

export function useUnfollowCoach() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coachId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.unfollowCoach(coachId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      toast.success('Unfollowed coach');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unfollow: ${error.message}`);
    },
  });
}

export function useIsFollowing(callerId: Principal | null, coachId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isFollowing', callerId?.toString(), coachId?.toString()],
    queryFn: async () => {
      if (!actor || !callerId || !coachId) return false;
      try {
        return await actor.isFollowing(callerId, coachId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!callerId && !!coachId,
    staleTime: 1000 * 30,
  });
}

export function useGetFollowers(coachId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['followers', coachId?.toString()],
    queryFn: async () => {
      if (!actor || !coachId) return [];
      try {
        return await actor.getFollowers(coachId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!coachId,
  });
}

export function useGetFollowing(coachId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['following', coachId?.toString()],
    queryFn: async () => {
      if (!actor || !coachId) return [];
      try {
        return await actor.getFollowing(coachId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!coachId,
  });
}

// Connections Queries (deprecated - use follow system instead)
export function useGetMyConnections() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['myConnections'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyConnections();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
  });
}

export function useConnectWithCoach() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coachId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.connectWithCoach(coachId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myConnections'] });
      queryClient.invalidateQueries({ queryKey: ['feedCategories'] });
      toast.success('Connection added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });
}

// Job Board Queries
export function useGetJobPostings() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<JobPost[]>({
    queryKey: ['jobPostings'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getJobPostings();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
  });
}

export function usePostJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      role: string;
      level: string;
      schoolOrOrganization: string;
      location: string;
      compensation: string | null;
      requirements: string;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.postJob(
        params.title,
        params.role,
        params.level,
        params.schoolOrOrganization,
        params.location,
        params.compensation,
        params.requirements,
        params.additionalInfo
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Job posted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to post job: ${error.message}`);
    },
  });
}

export function useApplyForJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { jobId: string; coverLetter: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.applyForJob(params.jobId, params.coverLetter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      toast.success('Application submitted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply: ${error.message}`);
    },
  });
}

export function useGetMyApplications() {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<[string, Application][]>({
    queryKey: ['myApplications'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyApplications();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
  });
}

export function useDeleteJobPosting() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteJobPosting(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetail'] });
      toast.success('Job posting deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });
}

// Messaging Queries
export function useGetDirectMessages(otherUser: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<DirectMessage[]>({
    queryKey: ['directMessages', otherUser?.toString()],
    queryFn: async () => {
      if (!actor || !otherUser) return [];
      try {
        return await actor.getDirectMessages(otherUser);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!otherUser,
  });
}

export function useSendDirectMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { receiver: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendDirectMessage(params.receiver, params.content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directMessages', variables.receiver.toString()] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

export function useGetGroupMessages(groupId: string | null) {
  const { actor, isFetching } = useActor();
  const { isInitializing } = useInternetIdentity();

  return useQuery<GroupMessage[]>({
    queryKey: ['groupMessages', groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      try {
        return await actor.getGroupMessages(groupId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !isInitializing && !!groupId,
  });
}

export function useSendGroupMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { groupId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendGroupMessage(params.groupId, params.content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groupMessages', variables.groupId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}
