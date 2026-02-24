import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IdeaService } from '../../../services/idea.service';
import { ReviewService } from '../../../services/review.service';
import { AuthService } from '../../../services/auth.service';
import { Comment, Idea, Review } from '../../../models/model';

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './decision.component.html',
  styleUrl: './decision.component.css',
})
export class DecisionComponent implements OnInit {
  ideas: Idea[] = [];
  selected: Idea | null = null;
  feedback = '';
  rejectionReason = '';
  reviews: Review[] = [];
  currentUserID = 0;
  currentUserName = '';
  comments: Comment[] = [];
  filterStatus: 'All' | 'Rejected' | 'UnderReview' | 'Approved' = 'All';
  isLoading = false;
  isSubmittingFeedback = false;
  isChangingStatus = false;
  showRejectionModal = false;
  canEditStatus = false; // Permission to edit status
  statusOptions: ('All' | 'Rejected' | 'UnderReview' | 'Approved')[] = [
    'All',
    'Rejected',
    'UnderReview',
    'Approved',
  ];

  get filteredIdeas(): Idea[] {
    if (this.filterStatus === 'All') {
      return this.ideas;
    }
    return this.ideas.filter((idea) => idea.status === this.filterStatus);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ideaService: IdeaService,
    private reviewService: ReviewService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // load user
    const user = this.authService.getCurrentUser();
    if (user && user.userID) {
      this.currentUserID = user.userID;
      this.currentUserName = user.name || '';
    }

    // Read query param first, then load ideas and auto-select if id is present
    const idFromRoute = this.route.snapshot.queryParamMap.get('id');
    this.loadIdeasForReview(idFromRoute ?? undefined);
  }

  loadIdeasForReview(selectIdeaId?: string) {
    this.isLoading = true;
    this.reviewService.getIdeasForReview().subscribe({
      next: (list) => {
        this.ideas = list;
        this.isLoading = false;
        // Auto-select idea if an id was passed (e.g. from manager dashboard)
        if (selectIdeaId) {
          const found = this.ideas.find(
            (i) => String(i.ideaID) === selectIdeaId,
          );
          if (found) this.select(found);
        }
      },
      error: (error) => {
        console.error('Error loading ideas for review:', error);
        this.isLoading = false;
      },
    });
  }

  filterByStatus(status: 'All' | 'Rejected' | 'UnderReview' | 'Approved') {
    this.filterStatus = status;
  }

  select(idea: Idea | null) {
    this.selected = idea;
    this.rejectionReason = '';

    if (idea) {
      // Update URL with the new idea's ID
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: idea.ideaID },
        queryParamsHandling: 'merge',
      });

      // Check if current user can edit status
      // Only the reviewer of an approved/rejected idea can change status
      this.canEditStatus =
        idea.status === 'UnderReview' ||
        idea.reviewedByID === this.currentUserID;

      // Load reviews from backend
      this.reviewService.getReviewsForIdea(idea.ideaID).subscribe({
        next: (reviews: Review[]) => {
          this.reviews = reviews;
        },
        error: (error: any) => {
          console.error('Error loading reviews:', error);
          this.reviews = [];
        },
      });

      // Load comments from backend
      this.ideaService.getCommentsForIdea(idea.ideaID).subscribe({
        next: (comments: Comment[]) => {
          this.comments = comments;
        },
        error: (error: any) => {
          console.error('Error loading comments:', error);
          this.comments = [];
        },
      });
    }
  }

  submitFeedback() {
    if (!this.selected || !this.feedback.trim()) {
      return;
    }

    this.isSubmittingFeedback = true;

    // Use new submitFeedback endpoint
    this.reviewService
      .submitFeedback(this.selected.ideaID, this.feedback.trim())
      .subscribe({
        next: (response: any) => {
          console.log('Feedback submitted successfully:', response);
          this.feedback = '';
          this.isSubmittingFeedback = false;

          // Reload comments and reviews
          if (this.selected) {
            this.ideaService
              .getCommentsForIdea(this.selected.ideaID)
              .subscribe({
                next: (comments: Comment[]) => {
                  this.comments = comments;
                },
              });

            this.reviewService
              .getReviewsForIdea(this.selected.ideaID)
              .subscribe({
                next: (reviews: Review[]) => {
                  this.reviews = reviews;
                },
              });
          }
        },
        error: (error: any) => {
          console.error('Error submitting feedback:', error);
          this.isSubmittingFeedback = false;
          const errorMsg =
            error.error?.message || error.error || 'Failed to submit feedback.';
          alert(errorMsg);
        },
      });
  }

  submitRejectionWithReason() {
    if (!this.selected) {
      return;
    }

    if (!this.rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!confirm('Are you sure you want to reject this idea?')) {
      return;
    }

    // Use new changeIdeaStatus endpoint with reviewComment
    this.performStatusChange('Rejected');
  }

  submitReviewWithDecision(decision: 'Approve' | 'Reject') {
    if (!this.selected) {
      return;
    }

    if (decision === 'Approve') {
      if (!confirm('Are you sure you want to approve this idea?')) {
        return;
      }

      // Use new changeIdeaStatus endpoint
      this.performStatusChange('Approved');
    } else {
      // Reject - handled separately in changeStatus
      this.changeStatus('Rejected');
    }
  }

  closeRejectionModal() {
    this.showRejectionModal = false;
    this.rejectionReason = '';
  }

  changeStatus(status: 'UnderReview' | 'Approved' | 'Rejected') {
    if (!this.selected) return;

    // Check if user has permission to change status
    if (!this.canEditStatus) {
      alert(
        'You do not have permission to change the status of this idea. Only the reviewer can modify it.',
      );
      return;
    }

    // If changing to Rejected, show modal for rejection reason
    if (status === 'Rejected') {
      this.showRejectionModal = true;
      return;
    }

    if (
      !confirm(`Are you sure you want to change the status to "${status}"?`)
    ) {
      return;
    }

    this.performStatusChange(status);
  }

  performStatusChange(status: 'UnderReview' | 'Approved' | 'Rejected') {
    if (!this.selected) return;

    this.isChangingStatus = true;

    // Pass rejectionReason only when status is Rejected
    const reviewComment =
      status === 'Rejected' ? this.rejectionReason : undefined;

    this.reviewService
      .changeIdeaStatus(this.selected.ideaID, status, reviewComment)
      .subscribe({
        next: () => {
          console.log('Status changed successfully');
          this.isChangingStatus = false;

          if (this.selected) {
            this.selected.status = status;
            if (status !== 'UnderReview') {
              this.selected.reviewedByID = this.currentUserID;
              this.selected.reviewedByName = this.currentUserName;
            }
          }

          this.showRejectionModal = false;
          this.rejectionReason = '';

          // Reload ideas to reflect changes
          this.loadIdeasForReview();
        },
        error: (error: any) => {
          console.error('Error changing status:', error);
          this.isChangingStatus = false;
          const errorMsg =
            error.error?.message ||
            'Failed to change status. Please try again.';
          alert(errorMsg);
        },
      });
  }
}