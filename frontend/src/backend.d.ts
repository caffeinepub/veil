import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Reaction {
    id: string;
    createdAt: Time;
    author: Principal;
    reactionType: ReactionType;
    postId: string;
}
export type Time = bigint;
export interface Flag {
    id: string;
    createdAt: Time;
    reporter: Principal;
    reason: string;
    postId: string;
}
export interface User {
    id: Principal;
    region: Region;
    pseudonym: string;
    createdAt: Time;
    subscriptionStatus: SubscriptionStatus;
    suspended: boolean;
    hasAcknowledgedEntryMessage: boolean;
    hasAcknowledgedPublicPostMessage: boolean;
}
export interface Comment {
    id: string;
    content: string;
    userId: Principal;
    createdAt: bigint;
    flagged: boolean;
    postId: string;
}
export interface SeatInfo {
    maxSeats: bigint;
    currentSeats: bigint;
}
export type Result_1 = {
    __kind__: "ok";
    ok: User;
} | {
    __kind__: "err";
    err: RegistrationError;
};
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface UserProfileUpdate {
    region: Region;
    pseudonym: string;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export type Result = {
    __kind__: "ok";
    ok: Post;
} | {
    __kind__: "err";
    err: string;
};
export interface Post {
    id: string;
    emotionType: EmotionType;
    content: string;
    createdAt: Time;
    author: Principal;
    updatedAt: Time;
    visibility: Visibility;
}
export interface TextReaction {
    id: string;
    userId: Principal;
    createdAt: Time;
    reactionText: string;
    postId: string;
}
export interface UserProfile {
    region: Region;
    pseudonym: string;
    subscriptionStatus: SubscriptionStatus;
    suspended: boolean;
    hasAcknowledgedEntryMessage: boolean;
    hasAcknowledgedPublicPostMessage: boolean;
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
    India = "India",
    Global = "Global"
}
export enum RegistrationError {
    AnonymousNotAllowed = "AnonymousNotAllowed",
    CapacityReached = "CapacityReached",
    InviteCodeUsed = "InviteCodeUsed",
    AlreadyRegistered = "AlreadyRegistered",
    InvalidInviteCode = "InvalidInviteCode"
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
export enum Variant_existingUser_anonymous_newUser {
    existingUser = "existingUser",
    anonymous = "anonymous",
    newUser = "newUser"
}
export enum Visibility {
    publicView = "publicView",
    privateView = "privateView"
}
export interface backendInterface {
    acknowledgeEntryMessage(): Promise<void>;
    acknowledgePublicPostMessage(): Promise<void>;
    addComment(postId: string, content: string): Promise<string>;
    addReaction(postId: string, reactionType: ReactionType): Promise<string>;
    addTextReaction(postId: string, reactionText: string): Promise<string>;
    adminApplyPublicPostingCooldown(userId: Principal): Promise<void>;
    adminClearESPFlag(userId: Principal): Promise<void>;
    adminDeletePost(postId: string): Promise<void>;
    adminGetAllFlaggedPostsWithRecords(): Promise<Array<[string, Array<Flag>]>>;
    adminGetAllPosts(): Promise<Array<Post>>;
    adminGetAllUsers(): Promise<Array<User>>;
    adminGetAllUsersExtended(): Promise<Array<[Principal, UserProfile]>>;
    adminGetESPFlaggedUsers(): Promise<Array<Principal>>;
    adminGetFlaggedPosts(): Promise<Array<Flag>>;
    adminGetHighRiskEmotionAlerts(): Promise<Array<[Principal, bigint]>>;
    adminGetUserPosts(userId: Principal): Promise<Array<Post>>;
    adminPermanentlyRemoveUser(userId: Principal): Promise<void>;
    adminRemovePost(postId: string): Promise<void>;
    adminSetSubscriptionStatus(userId: Principal, status: SubscriptionStatus): Promise<void>;
    adminSuspendUser(userId: Principal): Promise<void>;
    adminToggleUserSuspension(userId: Principal): Promise<boolean>;
    adminUnsuspendUser(userId: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkLoginStatus(): Promise<Variant_existingUser_anonymous_newUser>;
    createPost(emotionType: EmotionType, content: string, visibility: Visibility | null): Promise<Result>;
    deleteComment(commentId: string): Promise<void>;
    flagComment(commentId: string): Promise<void>;
    flagPost(postId: string, reason: string): Promise<string>;
    generateInviteCode(): Promise<string>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsByPost(postId: string): Promise<Array<Comment>>;
    getESPStatus(): Promise<boolean>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMyPosts(): Promise<Array<Post>>;
    getPublicPosts(): Promise<Array<Post>>;
    getReactionsForPost(postId: string): Promise<Array<Reaction>>;
    getSeatInfo(): Promise<SeatInfo>;
    getTextReactionsForPost(postId: string): Promise<Array<TextReaction>>;
    getUserProfile(userId: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    register(pseudonym: string, region: Region, inviteCode: string): Promise<Result_1>;
    revokeInviteCode(_code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfileUpdate): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    togglePostVisibility(postId: string): Promise<Result>;
    validateInviteCode(code: string): Promise<boolean>;
}
