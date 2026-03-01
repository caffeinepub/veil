import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import {
  EmotionType,
  ReactionType,
  Region,
  SubscriptionStatus,
  UserProfile,
  type Post,
  type User,
  type Reaction,
  type Flag,
  type Comment,
  Variant_existingUser_anonymous_newUser,
} from '../backend';

const ANONYMOUS_PRINCIPAL = '2vxsx-fae';

function useIsNonAnonymous() {
  const { identity } = useInternetIdentity();
  return !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;
}

// ─── Profile / Auth ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch (e: any) {
        if (e?.message?.includes('Unauthorized') || e?.message?.includes('Anonymous')) return null;
        throw e;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon,
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to save profile');
      }
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// useGetMyProfile is an alias for useGetCallerUserProfile for backward compatibility
export function useGetMyProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch (e: any) {
        if (e?.message?.includes('Unauthorized') || e?.message?.includes('Anonymous')) return null;
        throw e;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetMySubscriptionStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<SubscriptionStatus | null>({
    queryKey: ['mySubscriptionStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) return null;
      try {
        const profile = await actor.getCallerUserProfile();
        return profile ? profile.subscriptionStatus : null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      if (!isNonAnon) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useCheckLoginStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Variant_existingUser_anonymous_newUser>({
    queryKey: ['loginStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkLoginStatus();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pseudonym, region, inviteCode }: { pseudonym: string; region: Region; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to register');
      }
      const result = await actor.register(pseudonym, region, inviteCode);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['loginStatus'] });
    },
  });
}

// Admin register is not available in the backend — admins must use generateInviteCode + register flow
// Keeping this as a no-op wrapper that throws a clear error
export function useAdminRegister() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pseudonym, region }: { pseudonym: string; region: Region }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      // Generate an invite code, then register with it
      const code = await actor.generateInviteCode();
      const result = await actor.register(pseudonym, region, code);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetMyPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Post[]>({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) return [];
      return actor.getMyPosts();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useGetPublicPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Post[]>({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      return actor.getPublicPosts();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      emotionType,
      content,
      isPrivate,
    }: {
      emotionType: EmotionType;
      content: string;
      isPrivate: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to create posts');
      }
      const result = await actor.createPost(emotionType, content, isPrivate);
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

// editPost is not available in the new backend — removed
export function useEditPost() {
  return useMutation({
    mutationFn: async (_args: { postId: string; newContent: string }) => {
      throw new Error('Editing posts is not supported in this version.');
    },
  });
}

// deletePost for regular users is not available — only adminDeletePost exists
// Users can only delete via admin; keeping hook for UI compatibility
export function useDeletePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to delete posts');
      }
      // Use adminDeletePost — only works if caller is admin
      return actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

// setPostPrivacy is not available in the new backend
// Users set privacy at creation time; keeping hook for UI compatibility
export function useSetPostPrivacy() {
  return useMutation({
    mutationFn: async (_args: { postId: string; isPrivate: boolean }) => {
      throw new Error('Privacy cannot be changed after posting. Set privacy when creating the post.');
    },
  });
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export function useAddReaction() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to react to posts');
      }
      return actor.addReaction(postId, reactionType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reactionsForPost', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useGetReactionsForPost(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Reaction[]>({
    queryKey: ['reactionsForPost', postId],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      try {
        return await actor.getReactionsForPost(postId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon && !!postId,
    retry: false,
  });
}

// Legacy hook — kept for backward compatibility, now uses getReactionsForPost
export function useGetMyReaction(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<ReactionType | null>({
    queryKey: ['myReaction', postId],
    queryFn: async () => {
      if (!actor) return null;
      if (!isNonAnon) return null;
      try {
        const reactions = await actor.getReactionsForPost(postId);
        const myPrincipal = identity!.getPrincipal().toText();
        const mine = reactions.find(r => r.author.toString() === myPrincipal);
        return mine ? mine.reactionType : null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon && !!postId,
    retry: false,
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetCommentsForPost(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Comment[]>({
    queryKey: ['commentsForPost', postId],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      try {
        return await actor.getCommentsForPost(postId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon && !!postId,
    retry: false,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to comment');
      }
      return actor.addComment(postId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentsForPost', variables.postId] });
    },
  });
}

// ─── Flagging ─────────────────────────────────────────────────────────────────

export function useFlagPost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to flag posts');
      }
      return actor.flagPost(postId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlaggedPosts'] });
    },
  });
}

// ─── ESP ──────────────────────────────────────────────────────────────────────

export function useGetESPStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<boolean>({
    queryKey: ['espStatus'],
    queryFn: async () => {
      if (!actor) return false;
      if (!isNonAnon) return false;
      try {
        return await actor.getESPStatus();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminGetAllPublicPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Post[]>({
    queryKey: ['adminPublicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      return actor.adminGetAllPosts();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useAdminGetUserPosts() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      const { Principal } = await import('@dfinity/principal');
      return actor.adminGetUserPosts(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserPosts'] });
    },
  });
}

export function useAdminDeletePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      return actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPublicPosts'] });
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
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
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
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      const { Principal } = await import('@dfinity/principal');
      return actor.adminUnsuspendUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminSetSubscriptionStatus() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: SubscriptionStatus }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      const { Principal } = await import('@dfinity/principal');
      return actor.adminSetSubscriptionStatus(Principal.fromText(userId), status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminGetInviteCodes() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery({
    queryKey: ['adminInviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      // getInviteCodes returns InviteLinksModule.InviteCode[] (code, created, used)
      return actor.getInviteCodes();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

// addInviteCode doesn't exist in backend — generate is the only way to create codes
export function useAdminAddInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code: _code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      // Backend doesn't support adding custom codes; generate a random one instead
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useAdminGenerateInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useAdminRevokeInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

export function useAdminGetFlaggedPosts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<Flag[]>({
    queryKey: ['adminFlaggedPosts'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      return actor.adminGetFlaggedPosts();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useAdminGetSeatCount() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<bigint>({
    queryKey: ['adminSeatCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      if (!isNonAnon) return BigInt(0);
      return actor.adminGetSeatCount();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useAdminGetESPFlaggedUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery({
    queryKey: ['adminESPFlaggedUsers'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      return actor.adminGetESPFlaggedUsers();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useAdminClearESPFlag() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      const { Principal } = await import('@dfinity/principal');
      return actor.adminClearESPFlag(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminESPFlaggedUsers'] });
    },
  });
}
