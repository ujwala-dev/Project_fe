import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Idea, Comment, Vote, Review } from '../models/model';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IdeaService {
  private ideas$ = new BehaviorSubject<Idea[]>([]);
  private apiUrl = 'https://localhost:7175/api/Idea';

  constructor(private http: HttpClient) {
    // Don't auto-load - let components request fresh data when needed
  }

  loadIdeas(): void {
    console.log('Loading ideas from backend...');
    this.http.get<any[]>(`${this.apiUrl}/all`).subscribe({
      next: (ideas) => {
        console.log('Raw ideas from backend:', ideas);
        // Map backend response to frontend Idea model
        const mappedIdeas = ideas.map((idea) => ({
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
        }));
        console.log('Mapped ideas:', mappedIdeas);
        this.ideas$.next(mappedIdeas);
      },
      error: (error) => {
        console.error('Error loading ideas:', error);
        this.ideas$.next([]);
      },
    });
  }

  getAllIdeas(): Observable<Idea[]> {
    return this.ideas$.asObservable();
  }

  getMyIdeas(): Observable<Idea[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-ideas`).pipe(
      tap((ideas) => console.log('My ideas from backend:', ideas)),
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
        })),
      ),
    );
  }

  getIdeaById(id: number | string): Idea | undefined {
    return this.ideas$.value.find((i) => i.ideaID === id);
  }

  createIdea(partial: Partial<Idea>): Observable<Idea> {
    const payload = {
      title: partial.title || 'Untitled',
      description: partial.description || '',
      categoryId: partial.categoryID, // Send as GUID string
    };

    console.log('IdeaService - sending payload to backend:', payload);
    console.log(
      'CategoryId type:',
      typeof payload.categoryId,
      'Value:',
      payload.categoryId,
    );

    return this.http.post<any>(`${this.apiUrl}/submit`, payload).pipe(
      tap((response: any) => {
        console.log('Create idea response:', response);
        const newIdea: Idea = {
          ideaID: response.ideaId || response.ideaID,
          title: response.title,
          description: response.description,
          categoryID: response.categoryId || response.categoryID,
          userID: response.userId || response.userID,
          submittedDate: response.submittedDate || new Date().toISOString(),
          status: response.status || 'UnderReview',
          category: response.categoryName || response.category || '',
          upvotes: 0,
          downvotes: 0,
        };
        const ideas = [newIdea, ...this.ideas$.value];
        this.ideas$.next(ideas);
      }),
    );
  }

  deleteIdea(ideaID: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${ideaID}`).pipe(
      tap((response) => {
        console.log('Delete idea response:', response);
        // Update the ideas$ BehaviorSubject by removing the deleted idea
        const updatedIdeas = this.ideas$.value.filter(
          (idea) => idea.ideaID !== ideaID,
        );
        this.ideas$.next(updatedIdeas);
      }),
    );
  }

  addComment(c: Partial<Comment>): Observable<Comment> {
    const ideaId = c.ideaID;
    const payload = {
      text: c.text || '',
    };

    return this.http
      .post<any>(`https://localhost:7175/api/comment/${ideaId}`, payload)
      .pipe(
        tap((response) => {
          console.log('Comment added:', response);
        }),
        tap((response) => {
          const comment: Comment = {
            commentID: response.commentID,
            ideaID: response.ideaID || ideaId!,
            userID: response.userID,
            text: response.text,
            createdDate: response.createdDate,
            userName: response.userName,
          };
          return comment;
        }),
      );
  }

  getCommentsForIdea(ideaID: number | string): Observable<Comment[]> {
    return this.http
      .get<any[]>(`https://localhost:7175/api/comment/${ideaID}`)
      .pipe(
        tap((comments) => {
          console.log('Comments from backend:', comments);
          return comments.map((c) => ({
            commentID: c.commentID,
            ideaID: c.ideaID || ideaID,
            userID: c.userID,
            text: c.text,
            createdDate: c.createdDate,
            userName: c.userName,
            isDownvoteComment: c.isDownvoteComment || false, // Flag for downvote comments
          }));
        }),
      );
  }

  updateComment(commentID: number | string, text: string): Observable<any> {
    const payload = { text };
    return this.http.put(
      `https://localhost:7175/api/comment/${commentID}`,
      payload,
    );
  }

  deleteComment(commentID: number | string): Observable<any> {
    return this.http.delete(`https://localhost:7175/api/comment/${commentID}`);
  }
}
