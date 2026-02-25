import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IdeaService } from '../../../services/idea.service';
import { ReviewService } from '../../../services/review.service';
import { Idea } from '../../../models/model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  ideas: Idea[] = [];
  isLoading = false;

  constructor(private ideaService: IdeaService, private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadIdeas();
  }

  loadIdeas() {
    this.isLoading = true;
    // Use manager-specific endpoint to get ideas with full details
    this.reviewService.getIdeasForReview().subscribe({
      next: (list) => {
        this.ideas = list;
        this.isLoading = false;
        console.log('Manager dashboard loaded ideas:', this.ideas.length);
      },
      error: (error) => {
        console.error('Error loading ideas for manager:', error);
        this.isLoading = false;
        // Fallback to regular getAllIdeas if manager endpoint fails
        this.ideaService.loadIdeas();
        this.ideaService.getAllIdeas().subscribe((list) => {
          this.ideas = list;
        });
      },
    });
  }

  get totalIdeas(): number {
    return this.ideas.length;
  }

  get underReviewIdeas(): number {
    return this.ideas.filter((i) => i.status === 'UnderReview').length;
  }

  get approvedIdeas(): number {
    return this.ideas.filter((i) => i.status === 'Approved').length;
  }

  get rejectedIdeas(): number {
    return this.ideas.filter((i) => i.status === 'Rejected').length;
  }
}
