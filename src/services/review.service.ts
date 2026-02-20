import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Review, Idea } from '../models/model';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private reviewApiUrl = 'https://localhost:7175/api/review';
  private ideaApiUrl = 'https://localhost:7175/api/Idea';

  constructor(private http: HttpClient) {}

  // Review methods
  submitReview(
    ideaID: number | string,
    feedback: string,
    decision: 'Approve' | 'Reject',
    rejectionReason?: string,
  ): Observable<any> {
    const payload = {
      ideaId: ideaID,
      feedback: feedback,
      decision: decision,
      rejectionReason: rejectionReason,
    };
    return this.http.post(`${this.reviewApiUrl}/submit`, payload).pipe(
      tap((response) => {
        console.log('Review submitted:', response);
      }),
    );
  }

  getReviewsForIdea(ideaID: number | string): Observable<Review[]> {
    return this.http.get<any[]>(`${this.reviewApiUrl}/idea/${ideaID}`).pipe(
      tap((reviews) => {
        console.log('Reviews from backend:', reviews);
        return reviews.map((r) => ({
          reviewID: r.reviewID,
          ideaID: r.ideaID || ideaID,
          reviewerID: r.reviewerID,
          reviewerName: r.reviewerName,
          feedback: r.feedback,
          decision: r.decision,
          reviewDate: r.reviewDate,
        }));
      }),
    );
  }

  getMyReviews(): Observable<Review[]> {
    return this.http.get<any[]>(`${this.reviewApiUrl}/manager/my-reviews`).pipe(
      tap((reviews) => {
        return reviews.map((r) => ({
          reviewID: r.reviewID,
          ideaID: r.ideaID,
          reviewerID: r.reviewerID,
          reviewerName: r.reviewerName,
          feedback: r.feedback,
          decision: r.decision,
          reviewDate: r.reviewDate,
        }));
      }),
    );
  }

  updateReview(
    reviewID: number | string,
    feedback: string,
    decision: 'Approve' | 'Reject',
  ): Observable<any> {
    const payload = { feedback, decision };
    return this.http.put(`${this.reviewApiUrl}/${reviewID}`, payload);
  }

  deleteReview(reviewID: number | string): Observable<any> {
    return this.http.delete(`${this.reviewApiUrl}/${reviewID}`);
  }

  addReview(r: Partial<Review>): Review {
    // Deprecated - use submitReview instead
    const review: Review = {
      reviewID: Date.now(),
      ideaID: r.ideaID || 0,
      reviewerID: r.reviewerID || 0,
      reviewerName: r.reviewerName,
      feedback: r.feedback || '',
      decision: r.decision || 'Rejected',
      reviewDate: r.reviewDate || new Date().toISOString(),
    };
    return review;
  }

  // Manager methods for reviewing ideas
  getIdeasForReview(): Observable<Idea[]> {
    return this.http.get<any[]>(`${this.reviewApiUrl}/ideas`).pipe(
      tap((ideas) => console.log('Ideas for review from backend:', ideas)),
      map((ideas) =>
        ideas.map((idea) => ({
          ideaID: idea.ideaId || idea.ideaID,
          title: idea.title,
          description: idea.description,
          categoryID: idea.categoryId || idea.categoryID,
          userID: idea.userId || idea.userID,
          authorName:
            idea.submittedByUserName || idea.authorName || idea.userName || '',
          submittedDate: idea.submittedDate || new Date().toISOString(),
          status: idea.status || 'UnderReview',
          category: idea.categoryName || idea.category || '',
          upvotes: idea.upvotes || 0,
          downvotes: idea.downvotes || 0,
          reviewedByID: idea.reviewedByID || idea.reviewedById,
          reviewedByName: idea.reviewedByName || idea.reviewedByUserName,
        })),
      ),
    );
  }

  getIdeasByStatus(status: string): Observable<Idea[]> {
    return this.http
      .get<any[]>(`${this.reviewApiUrl}/ideas/status/${status}`)
      .pipe(
        tap((ideas) => console.log(`Ideas with status ${status}:`, ideas)),
        map((ideas) =>
          ideas.map((idea) => ({
            ideaID: idea.ideaId || idea.ideaID,
            title: idea.title,
            description: idea.description,
            categoryID: idea.categoryId || idea.categoryID,
            userID: idea.userId || idea.userID,
            authorName:
              idea.submittedByUserName ||
              idea.authorName ||
              idea.userName ||
              '',
            submittedDate: idea.submittedDate || new Date().toISOString(),
            status: idea.status || 'UnderReview',
            category: idea.categoryName || idea.category || '',
            upvotes: idea.upvotes || 0,
            downvotes: idea.downvotes || 0,
          })),
        ),
      );
  }

  getIdeaWithDetails(ideaID: number | string): Observable<any> {
    return this.http.get<any>(`${this.reviewApiUrl}/ideas/${ideaID}`).pipe(
      tap((response) => {
        console.log('Idea with full details:', response);
      }),
    );
  }

  changeIdeaStatus(
    ideaID: number | string,
    status: 'Rejected' | 'UnderReview' | 'Approved',
  ): Observable<any> {
    const payload = { status };
    return this.http.put(
      `${this.reviewApiUrl}/ideas/${ideaID}/status`,
      payload,
    );
  }

  setIdeaStatus(
    ideaID: number | string,
    status: 'Rejected' | 'UnderReview' | 'Approved',
  ) {
    // Deprecated - use changeIdeaStatus instead
    // This method is kept for backward compatibility but should be replaced with changeIdeaStatus
    return this.changeIdeaStatus(ideaID, status);
  }
}
