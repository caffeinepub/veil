import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  EmotionType,
  ReactionType,
  Region,
  SubscriptionStatus,
  UserProfile,
  SeatInfo,
  Visibility,
} from '../backend';
import type { Principal } from '@dfinity/principal';

// ─── Auth / Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Acknowledgement Mutations ────────────────────────────────────────────────

export function useAcknowledgeEntryMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.acknowledgeEntryMessage();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAcknowledgePublicPostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.acknowledgePublicPostMessage();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Seat Info ────────────────────────────────────────────────────────────────

export function useGetSeatInfo() {
  const { actor, isFetching } = useActor();

  return useQuery<SeatInfo>({
    queryKey: ['seatInfo'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSeatInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pseudonym,
      region,
      inviteCode,
    }: {
      pseudonym: string;
      region: Region;
      inviteCode: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.register(pseudonym, region, inviteCode);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['seatInfo'] });
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetPublicPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getPublicPosts();
      // Ensure strict chronological order: newest first
      return [...posts].sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getMyPosts();
      return [...posts].sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      emotionType,
      content,
      visibility,
    }: {
      emotionType: EmotionType;
      content: string;
      visibility: Visibility;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createPost(emotionType, content, visibility);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useTogglePostVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.togglePostVisibility(postId);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export function useGetReactionsForPost(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReactionsForPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      reactionType,
    }: {
      postId: string;
      reactionType: ReactionType;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReaction(postId, reactionType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.postId] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetCommentsForPost(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!actor) return [];
      const comments = await actor.getCommentsForPost(postId);
      return [...comments].sort((a, b) => Number(a.createdAt - b.createdAt));
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(postId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    },
  });
}

// ─── Flagging ─────────────────────────────────────────────────────────────────

export function useFlagPost() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.flagPost(postId, reason);
    },
  });
}

// ─── ESP ──────────────────────────────────────────────────────────────────────

export function useGetESPStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['espStatus'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getESPStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminAllPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminSuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminSuspendUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

export function useAdminUnsuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminUnsuspendUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

export function useAdminSetSubscriptionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: Principal;
      status: SubscriptionStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminSetSubscriptionStatus(userId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

export function useAdminGetUserPosts() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminGetUserPosts(userId);
    },
  });
}

export function useAdminGetFlaggedPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminFlaggedPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetFlaggedPosts();
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
      return actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminFlaggedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useAdminGetInviteCodes() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminInviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
      queryClient.invalidateQueries({ queryKey: ['seatInfo'] });
    },
  });
}

export function useAdminAddInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Use generateInviteCode as the backend doesn't have a separate addInviteCode
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useAdminRevokeInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useAdminGetESPFlaggedUsers() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminESPFlaggedUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetESPFlaggedUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminClearESPFlag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminClearESPFlag(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminESPFlaggedUsers'] });
    },
  });
}

export function useAdminGetSeatCount() {
  const { actor, isFetching } = useActor();

  return useQuery<SeatInfo>({
    queryKey: ['seatInfo'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSeatInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pseudonym,
      region,
      inviteCode,
    }: {
      pseudonym: string;
      region: Region;
      inviteCode: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.register(pseudonym, region, inviteCode);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['seatInfo'] });
    },
  });
}
