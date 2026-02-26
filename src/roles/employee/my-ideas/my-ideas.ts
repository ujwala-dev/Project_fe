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

  // Toast + delete modal state
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastTimer: any;
  toastOffset = 72;
  showDeleteModal = false;
  pendingDelete: Idea | null = null;
  isDeleting = false;
  deleteError = '';

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
    if (this.selected?.ideaID === idea.ideaID) {
      this.selected = null;
      this.comments = [];
      this.reviews = [];
      this.currentUpvoters = [];
      this.currentDownvoters = [];
      this.showVotersModal = false;
      return;
    }

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

  openDeleteModal(idea: Idea) {
    if (idea.status !== 'Rejected' && idea.status !== 'UnderReview') {
      this.showToast(
        'Only ideas Under Review or Rejected can be deleted.',
        'error',
      );
      return;
    }

    this.pendingDelete = idea;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    if (this.isDeleting) return;
    this.showDeleteModal = false;
    this.pendingDelete = null;
    this.deleteError = '';
  }

  confirmDelete() {
    if (!this.pendingDelete) return;

    this.isDeleting = true;
    this.deleteError = '';

    this.ideaService.deleteIdea(this.pendingDelete.ideaID).subscribe({
      next: () => {
        const deletedId = this.pendingDelete?.ideaID;
        this.ideas = this.ideas.filter((i) => i.ideaID !== deletedId);
        if (this.selected?.ideaID === deletedId) {
          this.selected = null;
        }
        this.showToast('Idea deleted successfully!', 'success');
        this.isDeleting = false;
        this.closeDeleteModal();
      },
      error: (error: any) => {
        console.error('Error deleting idea:', error);
        const errorMsg =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Failed to delete idea. Please try again.';
        this.deleteError = errorMsg;
        this.showToast(errorMsg, 'error');
        this.isDeleting = false;
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 2200);
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
