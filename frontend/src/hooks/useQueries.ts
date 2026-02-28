import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { EmotionType, ReactionType, Region, SubscriptionStatus, UserProfile, Post, User, InviteCode } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetMyProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<User | null>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMyProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pseudonym, region, inviteCode }: { pseudonym: string; region: Region; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.register(pseudonym, region, inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export function useGetSubscriptionStatus(userId: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SubscriptionStatus | null>({
    queryKey: ['subscriptionStatus', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      try {
        return await actor.getSubscriptionStatus(userId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userId,
    retry: false,
  });
}

export function useGetMySubscriptionStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<SubscriptionStatus | null>({
    queryKey: ['mySubscriptionStatus'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMySubscriptionStatus();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emotionType, content }: { emotionType: EmotionType; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return await actor.createPost(emotionType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

export function useMyPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyPosts();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for useMyPosts to match naming convention in implementation plan
export const useGetMyPosts = useMyPosts;

export function useEditPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, newContent }: { postId: string; newContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.editPost(postId, newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
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
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useSetPostPrivacy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isPrivate }: { postId: string; isPrivate: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setPostPrivacy(postId, isPrivate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

// ─── Public Feed ──────────────────────────────────────────────────────────────

export function usePublicPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPublicPosts();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for usePublicPosts to match naming convention in implementation plan
export const useGetPublicPosts = usePublicPosts;

// ─── Reactions ────────────────────────────────────────────────────────────────

export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return await actor.addReaction(postId, reactionType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myReaction', variables.postId] });
    },
  });
}

export function useMyReaction(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ReactionType | null>({
    queryKey: ['myReaction', postId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMyReaction(postId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminPublicPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['adminPublicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminGetAllPublicPosts();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPublicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserPosts'] });
    },
  });
}

export function useAdminUserPosts(userId: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['adminUserPosts', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        return await actor.adminGetUserPosts(userId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminGetAllUsers();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.adminSuspendUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useUnsuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.adminUnsuspendUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useUpdateSubscriptionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: Principal; status: SubscriptionStatus }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setSubscriptionStatus(userId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
    },
  });
}

export function useGetInviteCodes() {
  const { actor, isFetching } = useActor();

  return useQuery<InviteCode[]>({
    queryKey: ['inviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return await actor.getInviteCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return await actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}

export function useRevokeInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}
