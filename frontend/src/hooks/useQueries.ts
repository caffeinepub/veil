import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  Post,
  User,
  UserProfile,
  UserProfileUpdate,
  Comment,
  Reaction,
  TextReaction,
  Flag,
  SeatInfo,
  DirectMessage,
  RSVP,
  InviteCode,
} from '../backend';
import { Region, ReactionType, SubscriptionStatus, Visibility, MessageType, EmotionType } from '../backend';
import type { Principal } from '@dfinity/principal';

// ─── Auth / Profile ───────────────────────────────────────────────────────────

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
    mutationFn: async (profile: UserProfileUpdate) => {
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
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCheckLoginStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ['loginStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkLoginStatus();
    },
    enabled: !!actor && !isFetching && !!identity,
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

// ─── Registration / Seats ─────────────────────────────────────────────────────

export function useGetSeatInfo() {
  const { actor } = useActor();

  return useQuery<SeatInfo>({
    queryKey: ['seatInfo'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSeatInfo();
    },
    enabled: !!actor,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['seatInfo'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['loginStatus'] });
    },
  });
}

export function useValidateInviteCode(code: string) {
  const { actor } = useActor();

  return useQuery<boolean>({
    queryKey: ['validateInviteCode', code],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateInviteCode(code);
    },
    enabled: !!actor && code.length > 0,
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetPublicPosts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ['posts', 'public'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicPosts();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetMyPosts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ['posts', 'my'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPosts();
    },
    enabled: !!actor && !isFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ['posts', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'public'] });
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
      queryClient.invalidateQueries({ queryKey: ['posts', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'public'] });
    },
  });
}

// Alias for backward compat
export const useDeletePost = useTogglePostVisibility;

// ─── Reactions ────────────────────────────────────────────────────────────────

export function useGetReactionsForPost(postId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Reaction[]>({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReactionsForPost(postId);
    },
    enabled: !!actor && !isFetching && !!identity && !!postId,
  });
}

export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReaction(postId, reactionType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.postId] });
    },
  });
}

export function useGetTextReactionsForPost(postId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TextReaction[]>({
    queryKey: ['textReactions', postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTextReactionsForPost(postId);
    },
    enabled: !!actor && !isFetching && !!identity && !!postId,
  });
}

// Alias
export const useTextReactionsForPost = useGetTextReactionsForPost;

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

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetCommentsByPost(postId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentsByPost(postId);
    },
    enabled: !!actor && !isFetching && !!identity && !!postId,
  });
}

// Alias
export const useGetCommentsForPost = useGetCommentsByPost;

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

export function useFlagComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.flagComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flaggedComments'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'flaggedComments'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'flaggedPosts'] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminGetAllPosts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ['admin', 'allPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllPosts();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<User[]>({
    queryKey: ['admin', 'allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminGetAllUsersExtended() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['admin', 'allUsersExtended'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsersExtended();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminGetFlaggedPosts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Flag[]>({
    queryKey: ['admin', 'flaggedPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetFlaggedPosts();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminGetAllFlaggedPostsWithRecords() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Array<[string, Array<Flag>]>>({
    queryKey: ['admin', 'flaggedPostsWithRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllFlaggedPostsWithRecords();
    },
    enabled: !!actor && !isFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'flaggedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'flaggedPostsWithRecords'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'public'] });
    },
  });
}

// Alias
export const useAdminDeletePost = useAdminRemovePost;

export function useAdminSuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminSuspendUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsersExtended'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsersExtended'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsersExtended'] });
    },
  });
}

export function useAdminApplyCooldown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminApplyPublicPostingCooldown(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsers'] });
    },
  });
}

export function useAdminRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminPermanentlyRemoveUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsersExtended'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allPosts'] });
    },
  });
}

export function useAdminSetSubscriptionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: Principal; status: SubscriptionStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminSetSubscriptionStatus(userId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allUsersExtended'] });
    },
  });
}

export function useAdminGetHighRiskEmotionAlerts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Array<[Principal, bigint]>>({
    queryKey: ['admin', 'emotionAlerts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetHighRiskEmotionAlerts();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Aliases
export const useGetEmotionalAlerts = useAdminGetHighRiskEmotionAlerts;
export const useAdminGetEmotionalAlerts = useAdminGetHighRiskEmotionAlerts;

export function useGetCrisisRiskPosts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ['admin', 'crisisRiskPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const allPosts = await actor.adminGetAllPosts();
      return allPosts.filter((p) => p.flaggedForReview === 'crisisRisk');
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ─── Invite Codes ─────────────────────────────────────────────────────────────

export function useGetInviteCodes() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<InviteCode[]>({
    queryKey: ['admin', 'inviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Alias used by AdminInviteCodes
export const useAdminGetInviteCodes = useGetInviteCodes;

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inviteCodes'] });
    },
  });
}

// Alias
export const useAdminGenerateInviteCode = useGenerateInviteCode;

export function useRevokeInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inviteCodes'] });
    },
  });
}

// Alias used by AdminInviteCodes (old signature passed { code })
export function useAdminRevokeInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inviteCodes'] });
    },
  });
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export function useGetDirectMessages(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<DirectMessage[]>({
    queryKey: ['directMessages', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getDirectMessagesForUser(userId);
    },
    enabled: !!actor && !isFetching && !!identity && !!userId,
  });
}

export function useSendAdminMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, messageContent }: { recipient: string; messageContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      const p = Principal.fromText(recipient);
      return actor.sendAdminMessage(p, MessageType.admin, messageContent);
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
    mutationFn: async ({ recipient }: { recipient: string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      const p = Principal.fromText(recipient);
      return actor.sendCrisisResourceMessage(p, MessageType.resource);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

export function useSendCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, message }: { recipient: Principal; message: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendAdminMessage(recipient, MessageType.admin, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

export function useSendCrisisResources() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipient: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendCrisisResourceMessage(recipient, MessageType.resource);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
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

// ─── Ecosystem Silence ────────────────────────────────────────────────────────

export function useCheckEcosystemSilence() {
  const { data: publicPosts } = useGetPublicPosts();

  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
  const hasRecentPost = publicPosts?.some((p) => {
    const postTime = Number(p.createdAt) / 1_000_000;
    return postTime > fiveDaysAgo;
  });

  return {
    isSilent: publicPosts !== undefined && !hasRecentPost,
    isLoading: publicPosts === undefined,
  };
}

export function usePublishPromptPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      emotionType,
      content,
    }: {
      emotionType: EmotionType;
      content: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createPost(emotionType, content, Visibility.publicView);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allPosts'] });
    },
  });
}

// ─── ESP ──────────────────────────────────────────────────────────────────────

export function useGetESPStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['espStatus'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getESPStatus();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminGetESPFlaggedUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['admin', 'espFlaggedUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetESPFlaggedUsers();
    },
    enabled: !!actor && !isFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'espFlaggedUsers'] });
    },
  });
}

// ─── Flagged Comments (derived from all comments) ─────────────────────────────

export function useGetFlaggedComments() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Comment[]>({
    queryKey: ['admin', 'flaggedComments'],
    queryFn: async () => {
      if (!actor) return [];
      const allPosts = await actor.adminGetAllPosts();
      const publicPosts = allPosts.filter((p) => p.visibility === 'publicView');
      const commentArrays = await Promise.all(
        publicPosts.map((p) => actor.getCommentsByPost(p.id).catch(() => [] as Comment[]))
      );
      const allComments = commentArrays.flat();
      return allComments.filter((c) => c.flagged);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────

export function useGetAllRSVPs() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<RSVP[]>({
    queryKey: ['admin', 'rsvps'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRSVPs();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSubmitRSVP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      attending,
      inviteCode,
    }: {
      name: string;
      attending: boolean;
      inviteCode: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitRSVP(name, attending, inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rsvps'] });
    },
  });
}
