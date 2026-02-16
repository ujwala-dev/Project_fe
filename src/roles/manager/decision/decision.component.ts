import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  decision: 'Approve' | 'Reject' = 'Approve';
  reviews: Review[] = [];
  currentUserID = 0;
  currentUserName = '';
  comments: Comment[] = [];
  filterStatus: 'All' | 'Draft' | 'UnderReview' | 'Approved' = 'All';
  isLoading = false;
  statusOptions: ('All' | 'Draft' | 'UnderReview' | 'Approved')[] = [
    'All',
    'Draft',
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

    // Load ideas for review from backend
    this.loadIdeasForReview();

    // react to query param changes (e.g. opened from manager dashboard link)
    this.route.queryParamMap.subscribe((q) => {
      const id = q.get('id');
      if (id) {
        const found = this.ideas.find((i) => String(i.ideaID) === id);
        if (found) this.select(found);
      }
    });
  }

  loadIdeasForReview() {
    this.isLoading = true;
    this.reviewService.getIdeasForReview().subscribe({
      next: (list) => {
        this.ideas = list;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ideas for review:', error);
        this.isLoading = false;
      },
    });
  }

  filterByStatus(status: 'All' | 'Draft' | 'UnderReview' | 'Approved') {
    this.filterStatus = status;
  }

  select(idea: Idea | null) {
    this.selected = idea;
    if (idea) {
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

  submitReview() {
    if (!this.selected || !this.feedback.trim()) {
      alert('Please provide feedback for your review.');
      return;
    }

    this.reviewService
      .submitReview(this.selected.ideaID, this.feedback.trim(), this.decision)
      .subscribe({
        next: (response: any) => {
          console.log('Review submitted successfully:', response);
          alert('Review submitted successfully!');
          this.feedback = '';

          // Reload reviews
          if (this.selected) {
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
          console.error('Error submitting review:', error);
          const errorMsg =
            error.error?.message ||
            error.error ||
            'Failed to submit review. You may have already reviewed this idea.';
          alert(errorMsg);
        },
      });
  }

  changeStatus(status: 'Draft' | 'UnderReview' | 'Approved') {
    if (!this.selected) return;

    if (
      !confirm(`Are you sure you want to change the status to "${status}"?`)
    ) {
      return;
    }

    this.reviewService
      .changeIdeaStatus(this.selected.ideaID, status)
      .subscribe({
        next: () => {
          console.log('Status changed successfully');
          alert(`Status changed to ${status} successfully!`);
          if (this.selected) {
            this.selected.status = status;
          }
          // Reload ideas to reflect changes
          this.loadIdeasForReview();
        },
        error: (error) => {
          console.error('Error changing status:', error);
          alert('Failed to change status. Please try again.');
        },
      });
  }
}
