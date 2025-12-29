import e from "express";

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
}

export interface User {
  userID: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  status:'Active' | 'Inactive';
  joinedDate: string;
  lastLoginDate?: string;
}

export interface Idea {
  ideaID: number;
  title: string;
  description: string;
  categoryID: number;
  submittedByUserID: number;
  submittedDate: string;
  status: 'Draft' | 'UnderReview' | 'Approved';
  category?: string;
  upvotes?: number;
  downvotes?: number;
}
export interface Review {
  reviewID?: number;
  ideaID: number;
  reviewerID: number;
  reviewerName?: string;
  feedback: string;
  decision: 'Approve' | 'Reject';
  reviewDate?: string;
}

export interface Comment {
  commentID: number;
  ideaID: number;
  userID: number;
  text: string;
  createdDate: string;
  userName?: string;
}

export interface Vote {
  voteID: number;
  ideaID: number;
  userID: number;
  voteType: 'Upvote' | 'Downvote';
}

export interface Notification {
  notificationID: number;
  userID: number;
  type: 'NewIdea' | 'ReviewDecision'|'NewComment'
  message: string;
  status: 'Unread' | 'Read';
  createdDate: string;
  relatedIdeaID?: number;
  relatedUserName?: string;
 
}

export interface Category {
  categoryID: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdDate: string;
}

