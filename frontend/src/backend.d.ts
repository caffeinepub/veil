import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    region: Region;
    pseudonym: string;
}
export interface Reaction {
    id: string;
    userId: Principal;
    createdAt: Time;
    reactionType: ReactionType;
    postId: string;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export type Time = bigint;
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface User {
    id: Principal;
    region: Region;
    pseudonym: string;
    createdAt: Time;
    subscriptionStatus: SubscriptionStatus;
    subscriptionStartDate: Time;
    inviteCode: string;
    suspended: boolean;
}
export interface Post {
    id: string;
    emotionType: EmotionType;
    content: string;
    reactionCount: bigint;
    userId: Principal;
    createdAt: Time;
    isPrivate: boolean;
    editable: boolean;
}
export enum EmotionType {
    confess = "confess",
    happy = "happy",
    broke = "broke"
}
export enum ReactionType {
    support = "support",
    care = "care",
    strength = "strength"
}
export enum Region {
    global = "global",
    india = "india"
}
export enum SubscriptionStatus {
    active = "active",
    expired = "expired",
    grace = "grace"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addInviteCode(code: string): Promise<void>;
    addReaction(postId: string, reactionType: ReactionType): Promise<string>;
    adminDeletePost(postId: string): Promise<void>;
    adminGetAllPublicPosts(): Promise<Array<Post>>;
    adminGetAllUsers(): Promise<Array<User>>;
    adminGetUserPosts(userId: Principal): Promise<Array<Post>>;
    adminSuspendUser(userId: Principal): Promise<void>;
    adminUnsuspendUser(userId: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPost(emotionType: EmotionType, content: string): Promise<string>;
    deletePost(postId: string): Promise<void>;
    editPost(postId: string, newContent: string): Promise<void>;
    generateInviteCode(): Promise<string>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMyPosts(): Promise<Array<Post>>;
    getMyProfile(): Promise<User | null>;
    getMyReaction(postId: string): Promise<ReactionType | null>;
    getMySubscriptionStatus(): Promise<SubscriptionStatus>;
    getPublicPosts(): Promise<Array<Post>>;
    getSubscriptionStatus(userId: Principal): Promise<SubscriptionStatus>;
    getUserProfile(target: Principal): Promise<UserProfile | null>;
    getUserReactionOnPost(postId: string): Promise<Reaction | null>;
    initializeAdmin(): Promise<void>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    register(pseudonym: string, region: Region, inviteCode: string): Promise<void>;
    revokeInviteCode(code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPostPrivacy(postId: string, isPrivate: boolean): Promise<void>;
    setSubscriptionStatus(userId: Principal, status: SubscriptionStatus): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    validateInviteCode(code: string): Promise<boolean>;
}
