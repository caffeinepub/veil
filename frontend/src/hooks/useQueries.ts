import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Post,
  UserProfile,
  Comment,
  Flag,
  Reaction,
  TextReaction,
  DirectMessage,
  User,
} from '../backend';
import {
  EmotionType,
  ReviewFlag,
  Visibility,
  SubscriptionStatus,
  MessageType,
  Region,
} from '../backend';
import { Principal } from '@dfinity/principal';

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
    mutationFn: async (profile: { pseudonym: string; region: Region }) => {
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

export function useCheckLoginStatus() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['loginStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkLoginStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Seat Info ────────────────────────────────────────────────────────────────

export function useGetSeatInfo() {
  const { actor, isFetching } = useActor();

  return useQuery({
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
        throw new Error(String(result.err));
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

  return useQuery<Post[]>({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getPublicPosts();
      return [...posts].sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
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
      visibility: Visibility | null;
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
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
      queryClient.invalidateQueries({ queryKey: ['ecosystemSilence'] });
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
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
      queryClient.invalidateQueries({ queryKey: ['ecosystemSilence'] });
    },
  });
}

/** @deprecated Use useAdminRemovePost instead */
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
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
    },
  });
}

// ─── Text Reactions ───────────────────────────────────────────────────────────

/** Alias kept for backward compatibility */
export function useTextReactionsForPost(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TextReaction[]>({
    queryKey: ['textReactions', postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTextReactionsForPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetTextReactionsForPost(postId: string) {
  return useTextReactionsForPost(postId);
}

export function useAddTextReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionText }: { postId: string; reactionText: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTextReaction(postId, reactionText);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textReactions', variables.postId] });
    },
  });
}

export function useGetReactionsForPost(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Reaction[]>({
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
    mutationFn: async (params: { postId: string; reactionType: any }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReaction(params.postId, params.reactionType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.postId] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Alias kept for backward compatibility */
export function useGetCommentsForPost(postId: string) {
  return useGetCommentsByPost(postId);
}

export function useGetCommentsByPost(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!actor) return [];
      const comments = await actor.getCommentsByPost(postId);
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
      queryClient.invalidateQueries({ queryKey: ['flaggedComments'] });
    },
  });
}

export function useFlagComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.flagComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['flaggedComments'] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['flaggedComments'] });
    },
  });
}

export function useGetFlaggedComments() {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['flaggedComments'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.adminGetAllPosts();
      const publicPosts = posts.filter((p) => p.visibility === Visibility.publicView);
      const commentArrays = await Promise.all(
        publicPosts.map((p) => actor.getCommentsByPost(p.id).catch(() => [] as Comment[]))
      );
      const allComments = commentArrays.flat();
      return allComments.filter((c) => c.flagged);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Flagging ─────────────────────────────────────────────────────────────────

export function useFlagPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.flagPost(postId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlaggedPosts'] });
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

  return useQuery<Post[]>({
    queryKey: ['adminAllPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetFlaggedPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Flag[]>({
    queryKey: ['adminFlaggedPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetFlaggedPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetAllFlaggedPostsWithRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, Flag[]]>>({
    queryKey: ['flaggedPostsWithRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllFlaggedPostsWithRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['adminAllUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAdminGetAllUsersExtended() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['adminAllUsersExtended'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsersExtended();
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Returns a mutation (not a query) so callers can imperatively fetch posts
 * for a given user principal string.
 */
export function useAdminGetUserPosts() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminGetUserPosts(userId);
    },
  });
}

export function useAdminRemovePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminRemovePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminFlaggedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['flaggedPostsWithRecords'] });
      queryClient.invalidateQueries({ queryKey: ['crisisRiskPosts'] });
      queryClient.invalidateQueries({ queryKey: ['ecosystemSilence'] });
    },
  });
}

/** Alias: some components import useAdminDeletePost */
export function useAdminDeletePost() {
  return useAdminRemovePost();
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

export function useAdminToggleUserSuspension() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminToggleUserSuspension(userId);
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

export function useAdminPermanentlyRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminPermanentlyRemoveUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
      queryClient.invalidateQueries({ queryKey: ['seatInfo'] });
    },
  });
}

/** Alias kept for backward compatibility */
export function useAdminRemoveUser() {
  return useAdminPermanentlyRemoveUser();
}

export function useAdminApplyPublicPostingCooldown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminApplyPublicPostingCooldown(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

/** Alias kept for backward compatibility */
export function useAdminApplyCooldown() {
  return useAdminApplyPublicPostingCooldown();
}

// ─── Admin Seat Count ─────────────────────────────────────────────────────────

export function useAdminGetSeatCount() {
  return useGetSeatInfo();
}

// ─── Admin ESP ────────────────────────────────────────────────────────────────

export function useAdminGetESPFlaggedUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
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

// ─── Admin Invite Codes ───────────────────────────────────────────────────────

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
    mutationFn: async ({ code: _code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't support adding arbitrary codes; generate one instead
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

// ─── Admin Register ───────────────────────────────────────────────────────────

export function useAdminRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { pseudonym: string; region: Region; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.register(params.pseudonym, params.region, params.inviteCode);
      if (result.__kind__ === 'err') {
        throw new Error(String(result.err));
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['seatInfo'] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetUserProfile(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export function useGetDirectMessagesForUser(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<DirectMessage[]>({
    queryKey: ['directMessages', userId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDirectMessagesForUser(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useMarkDirectMessageAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markDirectMessageAsRead(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

// ─── Crisis Protocol ──────────────────────────────────────────────────────────

export function useGetCrisisRiskPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['crisisRiskPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const allPosts = await actor.adminGetAllPosts();
      return allPosts.filter((p) => p.flaggedForReview === ReviewFlag.crisisRisk);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendAdminMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipient: string; messageContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendAdminMessage(
        Principal.fromText(params.recipient),
        MessageType.admin,
        params.messageContent
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

export function useSendCrisisResourceMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipient: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendCrisisResourceMessage(
        Principal.fromText(params.recipient),
        MessageType.resource
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

// ─── Emotional Alerts ─────────────────────────────────────────────────────────

export function useAdminGetHighRiskEmotionAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, bigint]>>({
    queryKey: ['highRiskEmotionAlerts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetHighRiskEmotionAlerts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/** Alias kept for backward compatibility */
export function useAdminGetEmotionalAlerts() {
  return useAdminGetHighRiskEmotionAlerts();
}

// ─── Ecosystem Silence ────────────────────────────────────────────────────────

const FIVE_DAYS_NS = BigInt(5 * 24 * 60 * 60) * BigInt(1_000_000_000);

export function useCheckEcosystemSilence() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['ecosystemSilence'],
    queryFn: async () => {
      if (!actor) return false;
      const allPosts = await actor.adminGetAllPosts();
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const cutoff = now - FIVE_DAYS_NS;
      const hasRecentPublicPost = allPosts.some(
        (p) => p.visibility === Visibility.publicView && p.createdAt >= cutoff
      );
      return !hasRecentPublicPost;
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePublishPromptPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emotionType: EmotionType) => {
      if (!actor) throw new Error('Actor not available');
      const PROMPT_MESSAGE =
        'The community has been quiet for a while. Feel free to share something on your mind.';
      const result = await actor.createPost(emotionType, PROMPT_MESSAGE, Visibility.publicView);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecosystemSilence'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllPosts'] });
    },
  });
}
