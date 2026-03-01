import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { EmotionType, ReactionType, Region, SubscriptionStatus, UserProfile, type Post, type User, type InviteCode } from '../backend';

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

export function useGetMyProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<User | null>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) return null;
      try {
        return await actor.getMyProfile();
      } catch (e: any) {
        if (e?.message?.includes('Unauthorized') || e?.message?.includes('Anonymous')) return null;
        throw e;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}

export function useGetMySubscriptionStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery<SubscriptionStatus>({
    queryKey: ['mySubscriptionStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) throw new Error('Not authenticated');
      return actor.getMySubscriptionStatus();
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
        return await actor.isAdmin();
      } catch {
        return false;
      }
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
    mutationFn: async ({ pseudonym, region }: { pseudonym: string; region: Region }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to register');
      }
      const result = await actor.register(pseudonym, region);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

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
      const result = await actor.adminRegister(pseudonym, region);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
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

  return useQuery<Post[]>({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicPosts();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emotionType, content }: { emotionType: EmotionType; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to create posts');
      }
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
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to edit posts');
      }
      return actor.editPost(postId, newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

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
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in to update post privacy');
      }
      return actor.setPostPrivacy(postId, isPrivate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myReaction'] });
    },
  });
}

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
        return await actor.getMyReaction(postId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon && !!postId,
    retry: false,
  });
}

export function useGetUserReactionOnPost(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery({
    queryKey: ['userReactionOnPost', postId],
    queryFn: async () => {
      if (!actor) return null;
      if (!isNonAnon) return null;
      try {
        return await actor.getUserReactionOnPost(postId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && isNonAnon && !!postId,
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
      return actor.adminGetAllPublicPosts();
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
      return actor.setSubscriptionStatus(Principal.fromText(userId), status);
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

  return useQuery<InviteCode[]>({
    queryKey: ['adminInviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnon) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
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

export function useAdminAddInviteCode() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity || identity.getPrincipal().toText() === ANONYMOUS_PRINCIPAL) {
        throw new Error('Must be logged in');
      }
      return actor.addInviteCode(code);
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

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isNonAnon = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  return useQuery({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnon) throw new Error('Not authenticated');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching && isNonAnon,
    retry: false,
  });
}
