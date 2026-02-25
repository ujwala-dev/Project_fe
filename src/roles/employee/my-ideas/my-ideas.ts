import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IdeaService } from '../../../services/idea.service';
import { ReviewService } from '../../../services/review.service';
import { VoteService } from '../../../services/vote.service';
import { AuthService } from '../../../services/auth.service';
import {
  Idea,
  Comment as IdeaComment,
  Review,
  User,
} from '../../../models/model';

@Component({
  selector: 'app-my-ideas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-ideas.html',
  styleUrl: './my-ideas.css',
})
export class MyIdeas implements OnInit {
  ideas: Idea[] = [];
  filterStatus: 'All' | 'Rejected' | 'UnderReview' | 'Approved' = 'All';
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
  isLoading = true;

  // Map to store voters for each idea separately
  votersMap: Map<number | string, { upvoters: any[]; downvoters: any[] }> =
    new Map();
  showVotersModal = false;
  votersModalTitle = '';
  currentUpvoters: any[] = [];
  currentDownvoters: any[] = [];

  get filteredIdeas(): Idea[] {
    if (this.filterStatus === 'All') {
      return this.ideas;
    }
    return this.ideas.filter((idea) => idea.status === this.filterStatus);
  }

  constructor(
    private ideaService: IdeaService,
    private reviewService: ReviewService,
    private voteService: VoteService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyIdeas();
  }

  setFilter(status: 'All' | 'UnderReview' | 'Approved' | 'Rejected') {
    this.filterStatus = status;
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadMyIdeas() {
    this.isLoading = true;
    this.ideaService.getMyIdeas().subscribe({
      next: (ideas) => {
        this.ideas = ideas;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading my ideas:', error);
        this.isLoading = false;
      },
    });
  }

  selectIdea(idea: Idea) {
    this.selected = idea;

    // Clear previous data
    this.comments = [];
    this.reviews = [];
    this.currentUpvoters = [];
    this.currentDownvoters = [];

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
            this.selected.reviewComment = ideaWithReviewer.reviewComment;
            console.log('Updated selected idea with:', {
              reviewedByID: this.selected.reviewedByID,
              reviewedByName: this.selected.reviewedByName,
              reviewComment: this.selected.reviewComment,
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
      next: (comments: IdeaComment[]) => {
        this.comments = comments;
      },
      error: (error: any) => {
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

    // Load and store voters for this specific idea
    this.loadVotersForIdea(idea.ideaID);
  }

  loadVotersForIdea(ideaID: number | string) {
    this.voteService.getVotesForIdea(ideaID).subscribe({
      next: (votes: any[]) => {
        console.log('Votes for idea:', ideaID, votes);

        // Separate upvoters and downvoters
        const upvoters =
          votes.filter((v: any) => v.voteType === 'Upvote') || [];
        const downvoters =
          votes.filter((v: any) => v.voteType === 'Downvote') || [];

        // Store in map for this idea
        this.votersMap.set(ideaID, { upvoters, downvoters });

        // Update current voters only if this is the selected idea
        if (this.selected?.ideaID === ideaID) {
          this.currentUpvoters = upvoters;
          this.currentDownvoters = downvoters;
        }

        console.log('Stored voters for idea', ideaID, { upvoters, downvoters });
      },
      error: (error: any) => {
        console.error('Error loading voters:', error);
        this.votersMap.set(ideaID, { upvoters: [], downvoters: [] });

        // Only clear current voters if this is the selected idea
        if (this.selected?.ideaID === ideaID) {
          this.currentUpvoters = [];
          this.currentDownvoters = [];
        }
      },
    });
  }
  getVotersForIdea(ideaID: number | string) {
    return this.votersMap.get(ideaID) || { upvoters: [], downvoters: [] };
  }

  showUpvoters() {
    if (this.selected) {
      const voters = this.getVotersForIdea(this.selected.ideaID);
      this.currentUpvoters = voters.upvoters;
      this.currentDownvoters = [];
      this.votersModalTitle = 'Upvoted by';
      this.showVotersModal = true;
    }
  }

  showDownvoters() {
    if (this.selected) {
      const voters = this.getVotersForIdea(this.selected.ideaID);
      this.currentUpvoters = [];
      this.currentDownvoters = voters.downvoters;
      this.votersModalTitle = 'Downvoted by';
      this.showVotersModal = true;
    }
  }

  closeVotersModal() {
    this.showVotersModal = false;
  }

  deleteIdea(idea: Idea) {
    if (idea.status !== 'Rejected' && idea.status !== 'UnderReview') {
      alert(
        'You can only delete ideas that are in Rejected or Under Review status.',
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${idea.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    this.ideaService.deleteIdea(idea.ideaID).subscribe({
      next: () => {
        console.log('Idea deleted successfully');
        // Remove idea from list
        this.ideas = this.ideas.filter((i) => i.ideaID !== idea.ideaID);
        // Close detail panel if it was the selected idea
        if (this.selected?.ideaID === idea.ideaID) {
          this.selected = null;
        }
        alert('Idea deleted successfully');
      },
      error: (error: any) => {
        console.error('Error deleting idea:', error);
        const errorMsg =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Failed to delete idea. Please try again.';
        alert(errorMsg);
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
        next: (comment: IdeaComment) => {
          this.newComment = '';
          // Reload comments
          this.ideaService.getCommentsForIdea(this.selected!.ideaID).subscribe({
            next: (comments: IdeaComment[]) => {
              this.comments = comments;
            },
          });
        },
        error: (error: any) => {
          console.error('Error adding comment:', error);
          alert('Failed to add comment. Please try again.');
        },
      });
  }
}
