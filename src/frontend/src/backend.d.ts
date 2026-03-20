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
export interface FlagV2 {
    id: string;
    timestamp: Time;
    reporter: Principal;
    reason: FlagReason;
    postId: string;
}
export interface User {
    id: Principal;
    region: Region;
    pseudonym: string;
    createdAt: Time;
    publicPostingCooldownUntil: Time;
    subscriptionStatus: SubscriptionStatus;
    suspended: boolean;
    hasAcknowledgedEntryMessage: boolean;
    hasAcknowledgedPublicPostMessage: boolean;
}
export type FlagReason = {
    __kind__: "Spam";
    Spam: null;
} | {
    __kind__: "Offensive";
    Offensive: null;
} | {
    __kind__: "Harassment";
    Harassment: null;
} | {
    __kind__: "Other";
    Other: string;
};
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
export type Result = {
    __kind__: "ok";
    ok: Post;
} | {
    __kind__: "err";
    err: string;
};
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export type DirectMessageId = string;
export interface Post {
    id: string;
    emotionType: EmotionType;
    content: string;
    createdAt: Time;
    author: Principal;
    updatedAt: Time;
    flaggedForReview: ReviewFlag;
    visibility: Visibility;
}
export interface CommentV2 {
    id: string;
    pseudonym: string;
    commenter: Principal;
    comment: string;
    timestamp: Time;
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
export interface DirectMessage {
    id: DirectMessageId;
    to: Principal;
    isCrisisResource: boolean;
    content: string;
    from?: Principal;
    read: boolean;
    timestamp: Time;
}
export enum EmotionType {
    confess = "confess",
    happy = "happy",
    broke = "broke"
}
export enum MessageType {
    resource = "resource",
    admin = "admin"
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
export enum ReviewFlag {
    none = "none",
    crisisRisk = "crisisRisk"
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
export enum Visibility {
    publicView = "publicView",
    privateView = "privateView"
}
export interface backendInterface {
    acknowledgeEntryMessage(): Promise<void>;
    acknowledgePublicPostMessage(): Promise<void>;
    /**
     * / *** COMMENTS STORE AND FLAG SYSTEM ***
     */
    addComment(postId: string, pseudonym: string, commentText: string): Promise<string>;
    applyPublicPostingCooldown(userId: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPost(emotionType: EmotionType, content: string): Promise<Result>;
    deleteComment(commentId: string): Promise<void>;
    flagPost(postId: string, reason: FlagReason): Promise<string>;
    generateInviteCode(): Promise<string>;
    getAllAdminUsers(): Promise<Array<User>>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: string): Promise<Array<CommentV2>>;
    getDirectMessagesForUser(userId: Principal): Promise<Array<DirectMessage>>;
    getFlags(): Promise<Array<FlagV2>>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMyPosts(): Promise<Array<Post>>;
    getPublicPosts(): Promise<Array<Post>>;
    getSeatInfo(): Promise<SeatInfo>;
    getUserProfile(userId: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markDirectMessageAsRead(messageId: DirectMessageId): Promise<void>;
    permanentlyRemoveUser(userId: Principal): Promise<void>;
    register(pseudonym: string, region: Region, inviteCode: string): Promise<Result_1>;
    removePost(postId: string): Promise<void>;
    revokeInviteCode(_code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfileUpdate): Promise<void>;
    sendAdminMessage(recipient: Principal, _messageType: MessageType, messageContent: string): Promise<DirectMessageId>;
    sendCrisisResourceMessage(recipient: Principal, _messageType: MessageType): Promise<DirectMessageId>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    suspendUser(userId: Principal): Promise<void>;
    togglePostVisibility(postId: string): Promise<Result>;
    unsuspendUser(userId: Principal): Promise<void>;
    validateInviteCode(code: string): Promise<boolean>;
}
