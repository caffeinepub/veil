import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CommentV2,
  DirectMessage,
  EmotionType,
  FlagReason,
  FlagV2,
  InviteCode,
  MessageType,
  Post,
  RSVP,
  Region,
  Result,
  Result_1,
  SubscriptionStatus,
  User,
  UserProfile,
  UserProfileUpdate,
} from "../backend";
import { useActor } from "./useActor";

// ─── Local types for features not yet in backend ──────────────────────────────

export interface Reaction {
  id: string;
  postId: string;
  author: Principal;
  reactionType: string;
  createdAt: bigint;
}

export interface TextReaction {
  id: string;
  postId: string;
  userId: Principal;
  reactionText: string;
  createdAt: bigint;
}

export interface Comment {
  id: string;
  postId: string;
  userId: Principal;
  content: string;
  createdAt: number | bigint;
  flagged: boolean;
}

export interface Flag {
  id: string;
  postId: string;
  reporter: Principal;
  reason: string;
  createdAt: bigint;
}

export interface SeatInfo {
  currentSeats: number;
  maxSeats: number;
}

export enum ReactionType {
  support = "support",
  care = "care",
  strength = "strength",
}

// Re-export backend types for convenience
export type { CommentV2, FlagV2, FlagReason };

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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

export function useGetUserProfile(userId: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) throw new Error("Actor or userId not available");
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfileUpdate) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useAcknowledgeEntryMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.acknowledgeEntryMessage();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useAcknowledgePublicPostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.acknowledgePublicPostMessage();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function useGetSeatInfo() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<SeatInfo>({
    queryKey: ["seatInfo"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const info = await actor.getSeatInfo();
      return {
        currentSeats: Number(info.currentSeats),
        maxSeats: Number(info.maxSeats),
      };
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useValidateInviteCode() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.validateInviteCode(code);
    },
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
    }): Promise<Result_1> => {
      if (!actor) throw new Error("Actor not available");
      return actor.register(pseudonym, region, inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["seatInfo"] });
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetMyPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["myPosts"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getMyPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPublicPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["publicPosts"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPublicPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      emotionType,
      content,
    }: {
      emotionType: EmotionType;
      content: string;
    }): Promise<Result> => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(emotionType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["publicPosts"] });
    },
  });
}

export function useTogglePostVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string): Promise<Result> => {
      if (!actor) throw new Error("Actor not available");
      return actor.togglePostVisibility(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["publicPosts"] });
    },
  });
}

// Admin: publish a prompt post to re-engage the community (uses createPost under the hood)
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
    }): Promise<Result> => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(emotionType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicPosts"] });
      queryClient.invalidateQueries({ queryKey: ["allPublicPosts"] });
    },
  });
}

// ─── Reactions (stubbed — backend not yet implemented) ────────────────────────

export function useGetReactionsForPost(_postId: string) {
  return useQuery<Reaction[]>({
    queryKey: ["reactions", _postId],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetTextReactionsForPost(_postId: string) {
  return useQuery<TextReaction[]>({
    queryKey: ["textReactions", _postId],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAddReaction() {
  return useMutation({
    mutationFn: async (_vars: {
      postId: string;
      reactionType: ReactionType;
    }) => {
      throw new Error("Reactions are not yet available.");
    },
  });
}

export function useAddTextReaction() {
  return useMutation({
    mutationFn: async (_vars: { postId: string; reactionText: string }) => {
      throw new Error("Text reactions are not yet available.");
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<CommentV2[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getComments(postId);
    },
    enabled: !!actor && !actorFetching && !!postId,
  });
}

// Legacy alias kept for any existing references
export function useGetCommentsForPost(postId: string) {
  return useGetComments(postId);
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      pseudonym,
      commentText,
    }: {
      postId: string;
      pseudonym: string;
      commentText: string;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.addComment(postId, pseudonym, commentText);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

// Alias used by AdminFlaggedComments
export const useAdminDeleteComment = useDeleteComment;

export function useFlagComment() {
  return useMutation({
    mutationFn: async (_commentId: string) => {
      throw new Error("Comment flagging is not yet available.");
    },
  });
}

// Stub for admin flagged comments — backend does not expose this endpoint yet
export function useAdminGetFlaggedComments() {
  return useQuery<CommentV2[]>({
    queryKey: ["flaggedComments"],
    queryFn: async () => [],
    enabled: false,
  });
}

// ─── Flagging ─────────────────────────────────────────────────────────────────

export function useFlagPost() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      postId,
      reason,
    }: {
      postId: string;
      reason: FlagReason;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.flagPost(postId, reason);
    },
    // No query invalidation — flagging is silent and does not alter the feed
  });
}

export function useGetFlags() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<FlagV2[]>({
    queryKey: ["flags"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getFlags();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRemovePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.removePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      queryClient.invalidateQueries({ queryKey: ["publicPosts"] });
      queryClient.invalidateQueries({ queryKey: ["allPublicPosts"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

// ─── Admin flagged posts (legacy stub kept for backward compat) ───────────────

export function useAdminGetAllFlaggedPostsWithRecords() {
  return useQuery<Array<[string, Flag[]]>>({
    queryKey: ["flaggedPosts"],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAdminRemovePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.removePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      queryClient.invalidateQueries({ queryKey: ["publicPosts"] });
      queryClient.invalidateQueries({ queryKey: ["allPublicPosts"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedPosts"] });
    },
  });
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export function useGetDirectMessages(userId: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<DirectMessage[]>({
    queryKey: ["directMessages", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) throw new Error("Actor or userId not available");
      return actor.getDirectMessagesForUser(userId);
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

export function useMarkDirectMessageAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.markDirectMessageAsRead(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipient,
      messageType,
      content,
    }: {
      recipient: Principal;
      messageType: MessageType;
      content: string;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendAdminMessage(recipient, messageType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages"] });
    },
  });
}

export function useSendCrisisResourceMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipient,
      messageType,
    }: {
      recipient: Principal;
      messageType: MessageType;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendCrisisResourceMessage(recipient, messageType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCurrentUserAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      role,
    }: {
      user: Principal;
      role: import("../backend").UserRole;
    }): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
  });
}

// Admin login mutation — authenticates with a token and returns a session string
export function useAdminLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      token: _token,
    }: { token: string }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      // Verify the caller has admin rights
      const isAdmin = await actor.isCallerAdmin();
      if (!isAdmin) {
        throw new Error("Invalid admin token. Access denied.");
      }
      // Return a session identifier
      return `admin-session-${Date.now()}`;
    },
  });
}

// ─── Admin aliases (used by various admin components) ─────────────────────────

export function useAdminGetAllPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["allPublicPosts"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPublicPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Alias used by AdminDashboard
export const useGetAdminAllPostsForEcosystemCheck = useAdminGetAllPosts;

export interface ExtendedUser {
  id: Principal;
  pseudonym: string;
  region: string;
  subscriptionStatus: SubscriptionStatus;
  suspended: boolean;
  createdAt: bigint;
  hasAcknowledgedEntryMessage: boolean;
  hasAcknowledgedPublicPostMessage: boolean;
}

export function useAdminGetAllUsersExtended() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["allUsersExtended"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllAdminUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminSetSubscriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_vars: {
      userId: Principal;
      status: SubscriptionStatus;
    }) => {
      throw new Error("Set subscription status is not yet available.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersExtended"] });
    },
  });
}

export function useAdminToggleUserSuspension() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      suspend,
    }: { userId: Principal; suspend: boolean }): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      if (suspend) {
        return actor.suspendUser(userId);
      }
      return actor.unsuspendUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersExtended"] });
    },
  });
}

export function useAdminApplyPublicPostingCooldown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.applyPublicPostingCooldown(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersExtended"] });
    },
  });
}

export function useAdminPermanentlyRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.permanentlyRemoveUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersExtended"] });
    },
  });
}

export function useAdminGetHighRiskEmotionAlerts() {
  // Backend does not expose high-risk emotion alerts; return stub
  return useQuery<Array<{ userId: Principal; alertCount: number }>>({
    queryKey: ["highRiskEmotionAlerts"],
    queryFn: async () => [],
    enabled: false,
  });
}

// ─── Invite Codes ─────────────────────────────────────────────────────────────

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
    },
  });
}

export function useGetInviteCodes() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<InviteCode[]>({
    queryKey: ["inviteCodes"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getInviteCodes();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRevokeInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
    },
  });
}

// ─── RSVPs ────────────────────────────────────────────────────────────────────

export function useGetAllRSVPs() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<RSVP[]>({
    queryKey: ["rsvps"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllRSVPs();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSubmitRSVP() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      name,
      attending,
      inviteCode,
    }: {
      name: string;
      attending: boolean;
      inviteCode: string;
    }): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitRSVP(name, attending, inviteCode);
    },
  });
}
