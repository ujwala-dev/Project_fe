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
  status: 'Active' | 'Inactive';
}

export interface Idea {
  ideaID: number;
  title: string;
  description: string;
  categoryID: number;
  userID: number;
  authorName?: string;
  submittedDate: string;
  status: 'Draft' | 'UnderReview' | 'Approved';
  category?: string;
  upvotes?: number;
  downvotes?: number;
  Comments?: Comment[];
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
  ideaID: number | string;
  userID: number;
  text: string;
  createdDate: string;
  userName?: string;
  isDownvoteComment?: boolean; // Flag to indicate this is a downvote comment
}

export interface Vote {
  voteID: number;
  ideaID: number;
  userID: number;
  voteType: 'Upvote' | 'Downvote';
}

export interface Notification {
  notificationID: string; // Backend uses Guid
  userID: string; // Backend uses Guid
  type: 'NewIdea' | 'ReviewDecision' | 'NewComment';
  message: string;
  status: 'Unread' | 'Read';
  createdDate: string;
  relatedIdeaID?: string; // ideaId from backend (Guid)
  relatedUserName?: string; // reviewerName from backend
  ideaTitle?: string; // From backend DTO
  reviewerId?: string; // From backend DTO (Guid)
  reviewerName?: string; // From backend DTO
}

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  status: string;
  createdDate: string;
  ideaId?: string;
  ideaTitle?: string;
  reviewerId?: string;
  reviewerName?: string;
}

export interface Category {
  categoryID: number | string;
  name: string;
  description?: string;
  isActive: boolean;
}
