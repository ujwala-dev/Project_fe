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
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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

  selected: Idea | null = null;
  comments: IdeaComment[] = [];
  reviews: Review[] = [];
  newComment = '';
  currentUser: User | null = null;

  get filteredIdeas(): Idea[] {
    if (this.filterStatus === 'All') {
      return this.ideas;
    }
    return this.ideas.filter((idea) => idea.status === this.filterStatus);
  }

  constructor(
    private ideaService: IdeaService,
    private authService: AuthService,
    private voteService: VoteService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    // Set IdeaService reference in VoteService for auto-reload after voting
    this.voteService.setIdeaService(this.ideaService);
    // Load fresh ideas from backend for the current user session
    this.ideaService.loadIdeas();
    // Subscribe to get updates whenever ideas change
    this.ideaService.getAllIdeas().subscribe((list) => {
      this.ideas = list;
      // Check if current user has voted on each idea
      this.checkAllUserVotes();
      console.log('Dashboard received ideas:', this.ideas.length, 'ideas');
    });
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  checkAllUserVotes() {
    // Use forkJoin to wait for all vote checks to complete
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
          console.log(
            `Idea ${this.ideas[index].ideaID}: hasVoted=${this.ideas[index].hasVoted}`,
          );
        }
      });
    });
  }

  selectIdea(idea: Idea) {
    this.selected = idea;

    // Load reviewer information for approved/rejected ideas
    if (idea.status !== 'UnderReview') {
      console.log(
        'Loading reviewer info for idea:',
        idea.ideaID,
        'Status:',
        idea.status,
      );
      this.reviewService.getIdeaWithReviewerInfo(idea.ideaID).subscribe({
        next: (ideaWithReviewer: any) => {
          console.log('Received reviewer data:', ideaWithReviewer);
          if (this.selected && this.selected.ideaID === idea.ideaID) {
            this.selected.reviewedByID = ideaWithReviewer.reviewedByID;
            this.selected.reviewedByName = ideaWithReviewer.reviewedByName;
            console.log('Updated selected idea with:', {
              reviewedByID: this.selected.reviewedByID,
              reviewedByName: this.selected.reviewedByName,
            });
          }
        },
        error: (error) => {
          console.error('Error loading reviewer info:', error);
        },
      });
    }

    // Load comments from backend
    this.ideaService.getCommentsForIdea(idea.ideaID).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments = [];
      },
    });
    this.reviewService.getReviewsForIdea(idea.ideaID).subscribe({
      next: (reviews: Review[]) => {
        this.reviews = reviews;
      },
      error: (error: any) => {
        console.error('Error loading reviews:', error);
        this.reviews = [];
      },
    });
  }

  addComment() {
    if (!this.selected || !this.currentUser || !this.newComment.trim()) return;

    this.ideaService
      .addComment({
        ideaID: this.selected.ideaID,
        userID: this.currentUser.userID,
        text: this.newComment.trim(),
        userName: this.currentUser.name,
      })
      .subscribe({
        next: (comment) => {
          this.newComment = '';
          // Reload comments
          this.ideaService.getCommentsForIdea(this.selected!.ideaID).subscribe({
            next: (comments) => {
              this.comments = comments;
            },
          });
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          alert('Failed to add comment. Please try again.');
        },
      });
  }

  upvote(idea: Idea) {
    if (!this.currentUser) return;
    if (idea.hasVoted) {
      alert('You have already voted on this idea.');
      return;
    }

    // Store current scroll position
    const scrollY = window.scrollY;

    this.voteService.upvoteIdea(idea.ideaID).subscribe({
      next: (response: any) => {
        console.log('Upvoted successfully');
        // Update the UI only on success
        idea.upvotes = (idea.upvotes || 0) + 1;
        idea.hasVoted = true;
        idea.userVoteType = 'Upvote';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      },
      error: (error: any) => {
        console.error('Error upvoting:', error);
        const errorMsg =
          error.error?.message || error.error || 'Failed to upvote';
        alert(errorMsg);
      },
    });
  }

  downvote(idea: Idea) {
    if (!this.currentUser) return;

    if (idea.hasVoted) {
      alert('You have already voted on this idea.');
      return;
    }

    // Prompt for comment (mandatory for downvote)
    const comment = prompt(
      'Please provide a reason for your downvote (mandatory):',
    );

    if (comment === null) {
      // User cancelled
      return;
    }

    if (!comment || comment.trim() === '') {
      alert(
        'Comment is mandatory when downvoting. Please provide a reason for your downvote.',
      );
      return;
    }

    // Store current scroll position
    const scrollY = window.scrollY;

    this.voteService.downvoteIdea(idea.ideaID, comment.trim()).subscribe({
      next: (response: any) => {
        console.log('Downvoted successfully with comment');
        // Update the UI only on success
        idea.downvotes = (idea.downvotes || 0) + 1;
        idea.hasVoted = true;
        idea.userVoteType = 'Downvote';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      },
      error: (error: any) => {
        console.error('Error downvoting:', error);
        const errorMsg =
          error.error?.message || error.error || 'Failed to downvote';
        alert(errorMsg);
      },
    });
  }
}
