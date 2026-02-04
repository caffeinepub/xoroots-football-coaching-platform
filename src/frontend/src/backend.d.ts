import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface CoachProfileDetail {
    jobs: Array<JobPost>;
    followersCount: bigint;
    isAdmin: boolean;
    followingCount: bigint;
    comments: Array<Comment>;
    posts: Array<Post>;
    followers: Array<Principal>;
    following: Array<Principal>;
    profile: CoachProfile;
}
export interface DirectMessage {
    content: string;
    sender: Principal;
    timestamp: Time;
    receiver: Principal;
}
export interface Application {
    applicant: Principal;
    coverLetter: string;
    timestamp: Time;
    profile: CoachProfile;
}
export type Time = bigint;
export interface GroupMessage {
    content: string;
    sender: Principal;
    groupId: string;
    timestamp: Time;
}
export interface JobPost {
    id: string;
    additionalInfo: string;
    compensation?: string;
    title: string;
    schoolOrOrganization: string;
    role: string;
    level: string;
    timestamp: Time;
    requirements: string;
    applications: Array<Application>;
    location: string;
    poster: Principal;
}
export interface Comment {
    id: string;
    content: string;
    author: Principal;
    likes: Array<Principal>;
    timestamp: Time;
}
export interface Post {
    id: string;
    content: string;
    author: Principal;
    likes: Array<Principal>;
    timestamp: Time;
    comments: Array<Comment>;
    attachments: Array<Attachment>;
}
export interface Attachment {
    blob: ExternalBlob;
    mimeType: string;
    fileName: string;
}
export interface CoachProfile {
    bio: string;
    userId: Principal;
    name: string;
    coachingRoles: Array<string>;
    experience: bigint;
    specialty: string;
    positionsCoached: Array<string>;
    photo?: ExternalBlob;
    certifications: Array<string>;
    location: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: string, content: string): Promise<void>;
    applyForJob(jobId: string, coverLetter: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    connectWithCoach(coachId: Principal): Promise<void>;
    createPost(content: string, attachments: Array<Attachment>): Promise<void>;
    createProfile(name: string, experience: bigint, specialty: string, certifications: Array<string>, photo: ExternalBlob | null, bio: string, positionsCoached: Array<string>, location: string, coachingRoles: Array<string>): Promise<void>;
    deleteComment(postId: string, commentId: string): Promise<void>;
    deleteJobPosting(jobId: string): Promise<void>;
    deletePost(postId: string): Promise<void>;
    deleteUser(target: Principal): Promise<void>;
    dismissBannerNotification(): Promise<void>;
    followCoach(coachToFollow: Principal): Promise<void>;
    getAllProfiles(): Promise<Array<CoachProfile>>;
    getCallerUserProfile(): Promise<CoachProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoachCount(): Promise<bigint>;
    getCoachPhoto(coachId: Principal): Promise<ExternalBlob | null>;
    getCoachProfileDetail(coachId: Principal): Promise<CoachProfileDetail | null>;
    getConnections(userId: Principal): Promise<Array<Principal>>;
    getDirectMessages(otherUser: Principal): Promise<Array<DirectMessage>>;
    getFeed(): Promise<Array<Post>>;
    getFeedCategories(): Promise<{
        following: Array<Post>;
        forYou: Array<Post>;
    }>;
    getFollowerDetails(followerId: Principal, coachId: Principal): Promise<[boolean, Array<[Principal, CoachProfile]>, Array<[Principal, CoachProfile]>]>;
    getFollowers(coachId: Principal): Promise<Array<Principal>>;
    getFollowersCount(coachId: Principal): Promise<bigint>;
    getFollowing(coachId: Principal): Promise<Array<Principal>>;
    getFollowingCount(coachId: Principal): Promise<bigint>;
    getGroupMessages(groupId: string): Promise<Array<GroupMessage>>;
    getJobApplications(jobId: string): Promise<Array<Application>>;
    getJobPostings(): Promise<Array<JobPost>>;
    getMyApplications(): Promise<Array<[string, Application]>>;
    getMyConnections(): Promise<Array<Principal>>;
    getPost(postId: string): Promise<Post | null>;
    getPostAttachments(postId: string): Promise<Array<Attachment>>;
    getProfile(userId: Principal): Promise<CoachProfile | null>;
    getUserProfile(user: Principal): Promise<CoachProfile | null>;
    hasNewBannerNotification(): Promise<boolean>;
    initializeCallerProfile(): Promise<CoachProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(callerId: Principal, coachId: Principal): Promise<boolean>;
    markPostViewed(postId: string): Promise<void>;
    markPostsViewed(postIds: Array<string>): Promise<void>;
    postJob(title: string, role: string, level: string, schoolOrOrganization: string, location: string, compensation: string | null, requirements: string, additionalInfo: string): Promise<void>;
    saveCallerUserProfile(profile: CoachProfile): Promise<void>;
    saveProfilePhoto(photo: ExternalBlob): Promise<void>;
    sendDirectMessage(receiver: Principal, content: string): Promise<void>;
    sendGroupMessage(groupId: string, content: string): Promise<void>;
    submitReport(): Promise<void>;
    toggleLikeComment(postId: string, commentId: string): Promise<boolean>;
    toggleLikePost(postId: string): Promise<boolean>;
    unfollowCoach(coachToUnfollow: Principal): Promise<void>;
    updatePost(postId: string, newContent: string, newAttachments: Array<Attachment>): Promise<void>;
    updateProfile(name: string, experience: bigint, specialty: string, certifications: Array<string>, photo: ExternalBlob | null, bio: string, positionsCoached: Array<string>, location: string, coachingRoles: Array<string>): Promise<void>;
}
