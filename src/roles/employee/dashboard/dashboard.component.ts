import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IdeaService } from '../../../services/idea.service';
import { AuthService } from '../../../services/auth.service';
import { VoteService } from '../../../services/vote.service';
import { ReviewService } from '../../../services/review.service';
import {
  Idea,
  Comment as IdeaComment,
  Review,
  User,
} from '../../../models/model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  ideas: Idea[] = [];
  filterStatus: 'All' | 'UnderReview' | 'Approved' | 'Rejected' = 'All';
  statusOptions: Array<'All' | 'UnderReview' | 'Approved' | 'Rejected'> = [
    'All',
    'UnderReview',
    'Approved',
    'Rejected',
  ];

  selected: Idea | null = null;
  comments: IdeaComment[] = [];
  reviews: Review[] = [];
  newComment = '';
  currentUser: User | null = null;

  // Downvote modal & toast state
  showDownvoteModal = false;
  pendingDownvoteIdea: Idea | null = null;
  downvoteReason = '';
  downvoteError = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | '' = '';
  toastTimer: any;

  get filteredIdeas(): Idea[] {
    if (this.filterStatus === 'All') return this.ideas;
    return this.ideas.filter((idea) => idea.status === this.filterStatus);
  }

  get downvoteComments(): IdeaComment[] {
    return this.comments.filter((c) => c.isDownvoteComment);
  }

  get regularComments(): IdeaComment[] {
    return this.comments.filter((c) => !c.isDownvoteComment);
  }

  constructor(
    private ideaService: IdeaService,
    private authService: AuthService,
    private voteService: VoteService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.voteService.setIdeaService(this.ideaService);
    this.ideaService.loadIdeas();
    this.ideaService.getAllIdeas().subscribe((list) => {
      this.ideas = list;
      this.checkAllUserVotes();
    });
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  checkAllUserVotes() {
    if (this.ideas.length === 0) return;

    const voteChecks = this.ideas.map((idea) =>
      this.voteService.hasUserVoted(idea.ideaID).pipe(
        catchError((error) => {
          console.error('Error checking vote for idea', idea.ideaID, error);
          return of({ hasVoted: false, voteType: null });
        }),
      ),
    );

    forkJoin(voteChecks).subscribe((results) => {
      results.forEach((result, index) => {
        if (index < this.ideas.length) {
          this.ideas[index].hasVoted = result.hasVoted || false;
          this.ideas[index].userVoteType = result.voteType || null;
        }
      });
    });
  }

  selectIdea(idea: Idea) {
    this.selected = idea;

    if (idea.status !== 'UnderReview') {
      this.reviewService.getIdeaWithReviewerInfo(idea.ideaID).subscribe({
        next: (ideaWithReviewer: any) => {
          if (this.selected && this.selected.ideaID === idea.ideaID) {
            this.selected.reviewedByID = ideaWithReviewer.reviewedByID;
            this.selected.reviewedByName = ideaWithReviewer.reviewedByName;
            this.selected.reviewComment = ideaWithReviewer.reviewComment;
          }
        },
        error: (error) => {
          console.error('Error loading reviewer info:', error);
        },
      });
    }

    this.ideaService.getCommentsForIdea(idea.ideaID).subscribe({
      next: (comments) => (this.comments = comments),
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments = [];
      },
    });

    this.reviewService.getReviewsForIdea(idea.ideaID).subscribe({
      next: (reviews: Review[]) => (this.reviews = reviews),
      error: (error: any) => {
        console.error('Error loading reviews:', error);
        this.reviews = [];
      },
    });
  }

  setFilter(status: 'All' | 'UnderReview' | 'Approved' | 'Rejected') {
    this.filterStatus = status;
  }

  addComment() {
    if (!this.selected || !this.currentUser || !this.newComment.trim()) return;

    const text = this.newComment.trim();

    this.ideaService
      .addComment({
        ideaID: this.selected.ideaID,
        userID: this.currentUser.userID,
        text,
        userName: this.currentUser.name,
      })
      .subscribe({
        next: () => {
          this.newComment = '';
          this.ideaService.getCommentsForIdea(this.selected!.ideaID).subscribe({
            next: (comments) => (this.comments = comments),
          });
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          this.showToast('Failed to add comment. Please try again.', 'error');
        },
      });
  }

  upvote(idea: Idea) {
    if (!this.currentUser) {
      this.showToast('Please sign in to vote.', 'error');
      return;
    }
    if (idea.hasVoted) {
      this.showToast('You have already voted on this idea.', 'info');
      return;
    }

    const scrollY = window.scrollY;

    this.voteService.upvoteIdea(idea.ideaID).subscribe({
      next: () => {
        idea.upvotes = (idea.upvotes || 0) + 1;
        idea.hasVoted = true;
        idea.userVoteType = 'Upvote';
        window.scrollTo(0, scrollY);
      },
      error: (error: any) => {
        console.error('Error upvoting:', error);
        const errorMsg =
          error.error?.message || error.error || 'Failed to upvote';
        this.showToast(errorMsg, 'error');
      },
    });
  }

  downvote(idea: Idea) {
    if (!this.currentUser) {
      this.showToast('Please sign in to vote.', 'error');
      return;
    }
    if (idea.hasVoted) {
      this.showToast('You have already voted on this idea.', 'info');
      return;
    }

    this.pendingDownvoteIdea = idea;
    this.downvoteReason = '';
    this.downvoteError = '';
    this.showDownvoteModal = true;
  }

  closeDownvoteModal() {
    this.showDownvoteModal = false;
    this.pendingDownvoteIdea = null;
    this.downvoteReason = '';
    this.downvoteError = '';
  }

  submitDownvote() {
    if (!this.pendingDownvoteIdea || !this.currentUser) {
      this.closeDownvoteModal();
      return;
    }

    if (!this.downvoteReason.trim()) {
      this.downvoteError = 'Comment is mandatory when downvoting.';
      return;
    }

    const idea = this.pendingDownvoteIdea;
    const reason = this.downvoteReason.trim();
    const scrollY = window.scrollY;

    this.voteService.downvoteIdea(idea.ideaID, reason).subscribe({
      next: () => {
        idea.downvotes = (idea.downvotes || 0) + 1;
        idea.hasVoted = true;
        idea.userVoteType = 'Downvote';

        if (this.selected && this.selected.ideaID === idea.ideaID) {
          this.ideaService.getCommentsForIdea(idea.ideaID).subscribe({
            next: (comments) => (this.comments = comments),
            error: (err) => console.error('Error reloading comments:', err),
          });
        }

        this.showToast('Downvote submitted with comment.', 'success');
        this.closeDownvoteModal();
        window.scrollTo(0, scrollY);
      },
      error: (error: any) => {
        console.error('Error downvoting:', error);
        const errorMsg =
          error.error?.message || error.error || 'Failed to downvote';
        this.downvoteError = errorMsg;
        this.showToast(errorMsg, 'error');
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastType = '';
    }, 3000);
  }
}
