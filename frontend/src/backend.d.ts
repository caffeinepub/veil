import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Flag {
    id: string;
    createdAt: Time;
    reporter: Principal;
    reason: string;
    postId: string;
}
export interface Comment {
    id: string;
    content: string;
    createdAt: Time;
    author: Principal;
    postId: string;
}
export interface User {
    id: Principal;
    region: Region;
    pseudonym: string;
    createdAt: Time;
    subscriptionStatus: SubscriptionStatus;
    suspended: boolean;
}
export type Result_1 = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export type Result = {
    __kind__: "ok";
    ok: User;
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
    isPrivate: boolean;
}
export interface UserProfile {
    region: Region;
    pseudonym: string;
    subscriptionStatus: SubscriptionStatus;
    suspended: boolean;
}
export interface Reaction {
    id: string;
    createdAt: Time;
    author: Principal;
    reactionType: ReactionType;
    postId: string;
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
export interface backendInterface {
    addComment(postId: string, content: string): Promise<string>;
    addReaction(postId: string, reactionType: ReactionType): Promise<string>;
    adminClearESPFlag(userId: Principal): Promise<void>;
    adminDeletePost(postId: string): Promise<void>;
    adminGetAllPosts(): Promise<Array<Post>>;
    adminGetAllUsers(): Promise<Array<User>>;
    adminGetESPFlaggedUsers(): Promise<Array<Principal>>;
    adminGetFlaggedPosts(): Promise<Array<Flag>>;
    adminGetSeatCount(): Promise<bigint>;
    adminGetUserPosts(userId: Principal): Promise<Array<Post>>;
    adminSetSubscriptionStatus(userId: Principal, status: SubscriptionStatus): Promise<void>;
    adminSuspendUser(userId: Principal): Promise<void>;
    adminUnsuspendUser(userId: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkLoginStatus(): Promise<Variant_existingUser_anonymous_newUser>;
    createPost(emotionType: EmotionType, content: string, isPrivate: boolean): Promise<Result_1>;
    flagPost(postId: string, reason: string): Promise<string>;
    generateInviteCode(): Promise<string>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsForPost(postId: string): Promise<Array<Comment>>;
    getESPStatus(): Promise<boolean>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMyPosts(): Promise<Array<Post>>;
    getPublicPosts(): Promise<Array<Post>>;
    getReactionsForPost(postId: string): Promise<Array<Reaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    register(pseudonym: string, region: Region, inviteCode: string): Promise<Result>;
    revokeInviteCode(_code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    validateInviteCode(code: string): Promise<boolean>;
}
