import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { EmotionType, ReactionType, Region, SubscriptionStatus, type Post, type User, type UserProfile, type InviteCode } from '../backend';

// ─── Helper: Extract clean error message from ICP canister trap ───────────────

export function extractCanisterError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    // ICP canister trap messages look like:
    // "Canister <id> trapped explicitly: <actual message>"
    // or "Call failed:\n...\nMessage: <actual message>"
    const trapMatch = msg.match(/trapped explicitly:\s*(.+)/i);
    if (trapMatch) return trapMatch[1].trim();

    const messageMatch = msg.match(/Message:\s*(.+)/i);
    if (messageMatch) return messageMatch[1].trim();

    // Return the raw message if no pattern matched
    return msg;
  }
  return 'An unexpected error occurred. Please try again.';
}

// ─── Profile Hooks ────────────────────────────────────────────────────────────

export function useGetMyProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const query = useQuery<User | null>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && isAuthenticated && query.isFetched,
  };
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && isAuthenticated && query.isFetched,
  };
}

export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAdmin();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });
}

// ─── Subscription Hooks ───────────────────────────────────────────────────────

export function useGetMySubscriptionStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<SubscriptionStatus>({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMySubscriptionStatus();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });
}

export function useSetSubscriptionStatus() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: SubscriptionStatus }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.setSubscriptionStatus(Principal.fromText(userId), status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
    },
  });
}

// ─── Post Hooks ───────────────────────────────────────────────────────────────

export function useGetMyPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Post[]>({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPosts();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });
}

export function useGetPublicPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Post[]>({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicPosts();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emotionType, content }: { emotionType: EmotionType; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.createPost(emotionType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, newContent }: { postId: string; newContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.editPost(postId, newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useSetPostPrivacy() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isPrivate }: { postId: string; isPrivate: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.setPostPrivacy(postId, isPrivate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

// ─── Reaction Hooks ───────────────────────────────────────────────────────────

export function useGetMyReaction(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<ReactionType | null>({
    queryKey: ['myReaction', postId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyReaction(postId);
    },
    enabled: !!actor && !actorFetching && !!postId && isAuthenticated,
  });
}

export function useAddReaction() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.addReaction(postId, reactionType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myReaction', variables.postId] });
    },
  });
}

// ─── Registration Hooks ───────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pseudonym, region, inviteCode }: { pseudonym: string; region: Region; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated. Please log in first.');
      try {
        return await actor.register(pseudonym, region, inviteCode);
      } catch (err: unknown) {
        // Re-throw with a cleaned-up message so the UI can display it directly
        const clean = extractCanisterError(err);
        throw new Error(clean);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useValidateInviteCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateInviteCode(code);
    },
  });
}

// ─── Invite Code Hooks ────────────────────────────────────────────────────────

export function useGetInviteCodes() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<InviteCode[]>({
    queryKey: ['adminInviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });
}

export function useAddInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.addInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useRevokeInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

// ─── Admin Hooks ──────────────────────────────────────────────────────────────

export function useAdminGetAllPublicPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Post[]>({
    queryKey: ['adminPublicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllPublicPosts();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });
}

export function useAdminGetUserPosts(userId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Post[]>({
    queryKey: ['adminUserPosts', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.adminGetUserPosts(Principal.fromText(userId));
    },
    enabled: !!actor && !actorFetching && !!userId && isAuthenticated,
  });
}

export function useAdminDeletePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      return actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPublicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

export function useAdminSuspendUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.adminSuspendUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminUnsuspendUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().isAnonymous()) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.adminUnsuspendUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}
