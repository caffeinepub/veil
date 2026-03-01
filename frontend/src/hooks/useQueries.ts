import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import {
  Region,
  EmotionType,
  ReactionType,
  SubscriptionStatus,
  UserRole,
  type User,
  type Post,
  type UserProfile,
  type Reaction,
  type InviteCode,
  type RSVP,
} from '../backend';

// ---------------------------------------------------------------------------
// Helper: check that the current identity is non-anonymous
// ---------------------------------------------------------------------------
function isNonAnonymous(identity: ReturnType<typeof useInternetIdentity>['identity']): boolean {
  if (!identity) return false;
  try {
    return !identity.getPrincipal().isAnonymous();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth guard hook — centralises the "ready to call backend" check
// ---------------------------------------------------------------------------
function useAuthGuard() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const authenticated = isNonAnonymous(identity);
  const ready = !!actor && !actorFetching && !isInitializing && authenticated;
  return { actor, ready, authenticated, identity };
}

// ---------------------------------------------------------------------------
// User profile hooks (authorization component contract)
// ---------------------------------------------------------------------------

export function useGetCallerUserProfile() {
  const { actor, ready } = useAuthGuard();
  const { identity, isInitializing } = useInternetIdentity();
  const actorData = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) return null;
      return actor.getCallerUserProfile();
    },
    enabled: ready,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorData.isFetching || isInitializing || query.isLoading,
    isFetched: ready && query.isFetched,
  };
}

export function useGetUserProfile(target?: string) {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', target],
    queryFn: async () => {
      if (!actor || !target) return null;
      if (!isNonAnonymous(identity)) return null;
      const { Principal } = await import('@dfinity/principal');
      return actor.getUserProfile(Principal.fromText(target));
    },
    enabled: ready && !!target,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor, ready, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: ready,
    retry: false,
  });
}

export function useAssignCallerUserRole() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: string; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.assignCallerUserRole(Principal.fromText(user), role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      if (!isNonAnonymous(identity)) return false;
      return actor.isCallerAdmin();
    },
    enabled: ready,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// App-specific hooks
// ---------------------------------------------------------------------------

export function useGetMyProfile() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<User | null>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) return null;
      return actor.getMyProfile();
    },
    enabled: ready,
    retry: false,
  });
}

export function useGetMySubscriptionStatus() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<SubscriptionStatus>({
    queryKey: ['mySubscriptionStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.getMySubscriptionStatus();
    },
    enabled: ready,
    retry: false,
  });
}

export function useGetSubscriptionStatus(userId?: string) {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<SubscriptionStatus>({
    queryKey: ['subscriptionStatus', userId],
    queryFn: async () => {
      if (!actor || !userId) throw new Error('Actor or userId not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.getSubscriptionStatus(Principal.fromText(userId));
    },
    enabled: ready && !!userId,
    retry: false,
  });
}

export function useGetPublicPosts() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<Post[]>({
    queryKey: ['publicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnonymous(identity)) return [];
      return actor.getPublicPosts();
    },
    enabled: ready,
  });
}

export function useGetMyPosts() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<Post[]>({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnonymous(identity)) return [];
      return actor.getMyPosts();
    },
    enabled: ready,
  });
}

export function useIsAdmin() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      if (!isNonAnonymous(identity)) return false;
      return actor.isAdmin();
    },
    enabled: ready,
    retry: false,
  });
}

export function useRegister() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pseudonym, region }: { pseudonym: string; region: Region }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Cannot register with anonymous principal');
      const result = await actor.register(pseudonym, region);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useAdminRegister() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pseudonym, region }: { pseudonym: string; region: Region }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Cannot register with anonymous principal');
      const result = await actor.adminRegister(pseudonym, region);
      if (result.__kind__ === 'err') {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

export function useValidateInviteCode() {
  const { actor, identity } = useAuthGuard();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.validateInviteCode(code);
    },
  });
}

export function useCreatePost() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emotionType, content }: { emotionType: EmotionType; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.createPost(emotionType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useEditPost() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, newContent }: { postId: string; newContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.editPost(postId, newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useDeletePost() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useSetPostPrivacy() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isPrivate }: { postId: string; isPrivate: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.setPostPrivacy(postId, isPrivate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useAddReaction() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.addReaction(postId, reactionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myReaction'] });
      queryClient.invalidateQueries({ queryKey: ['userReactionOnPost'] });
    },
  });
}

export function useGetMyReaction(postId: string) {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<ReactionType | null>({
    queryKey: ['myReaction', postId],
    queryFn: async () => {
      if (!actor) return null;
      if (!isNonAnonymous(identity)) return null;
      return actor.getMyReaction(postId);
    },
    enabled: ready && !!postId,
    retry: false,
  });
}

export function useGetUserReactionOnPost(postId: string) {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<Reaction | null>({
    queryKey: ['userReactionOnPost', postId],
    queryFn: async () => {
      if (!actor) return null;
      if (!isNonAnonymous(identity)) return null;
      return actor.getUserReactionOnPost(postId);
    },
    enabled: ready && !!postId,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Admin hooks
// ---------------------------------------------------------------------------

export function useAdminGetAllPublicPosts() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<Post[]>({
    queryKey: ['adminAllPublicPosts'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnonymous(identity)) return [];
      return actor.adminGetAllPublicPosts();
    },
    enabled: ready,
  });
}

export function useAdminGetUserPosts() {
  const { actor, identity } = useAuthGuard();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.adminGetUserPosts(Principal.fromText(userId));
    },
  });
}

export function useAdminGetAllUsers() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<User[]>({
    queryKey: ['adminAllUsers'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnonymous(identity)) return [];
      return actor.adminGetAllUsers();
    },
    enabled: ready,
  });
}

export function useAdminDeletePost() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.adminDeletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllPublicPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
  });
}

export function useAdminSuspendUser() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.adminSuspendUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

export function useAdminUnsuspendUser() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.adminUnsuspendUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    },
  });
}

export function useAdminSetSubscriptionStatus() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: SubscriptionStatus }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      const { Principal } = await import('@dfinity/principal');
      return actor.setSubscriptionStatus(Principal.fromText(userId), status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionStatus'] });
    },
  });
}

// Keep old name for backward compatibility
export const useSetSubscriptionStatus = useAdminSetSubscriptionStatus;

// ---------------------------------------------------------------------------
// Invite code hooks (admin)
// ---------------------------------------------------------------------------

export function useAdminGetInviteCodes() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<InviteCode[]>({
    queryKey: ['adminInviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnonymous(identity)) return [];
      return actor.getInviteCodes();
    },
    enabled: ready,
  });
}

// Keep old name for backward compatibility
export const useGetInviteCodes = useAdminGetInviteCodes;

export function useAdminAddInviteCode() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.addInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

// Keep old name for backward compatibility
export const useAddInviteCode = useAdminAddInviteCode;

export function useAdminGenerateInviteCode() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

// Keep old name for backward compatibility
export const useGenerateInviteCode = useAdminGenerateInviteCode;

export function useAdminRevokeInviteCode() {
  const { actor, identity } = useAuthGuard();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.revokeInviteCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInviteCodes'] });
    },
  });
}

// Keep old name for backward compatibility
export const useRevokeInviteCode = useAdminRevokeInviteCode;

export function useGetAllRSVPs() {
  const { actor, ready, identity } = useAuthGuard();

  return useQuery<RSVP[]>({
    queryKey: ['allRSVPs'],
    queryFn: async () => {
      if (!actor) return [];
      if (!isNonAnonymous(identity)) return [];
      return actor.getAllRSVPs();
    },
    enabled: ready,
  });
}

export function useSubmitRSVP() {
  const { actor, identity } = useAuthGuard();

  return useMutation({
    mutationFn: async ({ name, attending, inviteCode }: { name: string; attending: boolean; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!isNonAnonymous(identity)) throw new Error('Not authenticated');
      return actor.submitRSVP(name, attending, inviteCode);
    },
  });
}
