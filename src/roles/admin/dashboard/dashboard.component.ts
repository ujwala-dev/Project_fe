import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IdeaService } from '../../../services/idea.service';
import { CategoryService } from '../../../services/category.service';
import { UserRole, Idea, User, Category } from '../../../models/model';
import { UserService } from '../../../services/user.service';
import { ReportsService } from '../../../services/reports.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: true,
})
export class DashboardComponent implements OnInit {
  // Statistics
  totalUsers = 0;
  totalAdmins = 0;
  totalManagers = 0;
  totalEmployees = 0;

  totalIdeas = 0;
  rejectedIdeas = 0;
  underReviewIdeas = 0;
  approvedIdeas = 0;

  totalCategories = 0;
  activeCategories = 0;

  approvalRate = 0;

  recentIdeas: Idea[] = [];
  recentUsers: User[] = [];

  constructor(
    private ideaService: IdeaService,
    private userService: UserService,
    private categoryService: CategoryService,
    private reportsService: ReportsService,
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    // Load all data from reports service for better performance
    this.reportsService.getSystemOverview().subscribe({
      next: (report) => {
        // Update user statistics
        this.totalUsers = report.totalUsers;
        this.totalAdmins = report.totalAdmins;
        this.totalManagers = report.totalManagers;
        this.totalEmployees = report.totalEmployees;

        // Update idea statistics
        this.totalIdeas = report.totalIdeas;
        this.approvedIdeas = report.totalApprovedIdeas;
        this.rejectedIdeas = report.totalRejectedIdeas;
        this.underReviewIdeas = report.totalUnderReviewIdeas;
        this.approvalRate = report.approvalRate;

        // Update category statistics
        this.totalCategories = report.totalCategories;
        this.activeCategories = report.activeCategories;
      },
      error: (error) => {
        console.error('Error loading system overview:', error);
        // Fallback to individual service calls
        this.loadStatisticsFallback();
      },
    });

    // Load recent data
    this.loadRecentIdeas();
    this.loadRecentUsers();
  }

  loadStatisticsFallback(): void {
    // Load users as fallback
    this.userService.getAllUsers().subscribe((users) => {
      this.totalUsers = users.length;
      this.totalAdmins = users.filter((u) => u.role === UserRole.ADMIN).length;
      this.totalManagers = users.filter(
        (u) => u.role === UserRole.MANAGER,
      ).length;
      this.totalEmployees = users.filter(
        (u) => u.role === UserRole.EMPLOYEE,
      ).length;
    });

    // Load ideas
    this.ideaService.getAllIdeas().subscribe((ideas) => {
      this.totalIdeas = ideas.length;
      this.rejectedIdeas = ideas.filter((i) => i.status === 'Rejected').length;
      this.underReviewIdeas = ideas.filter(
        (i) => i.status === 'UnderReview',
      ).length;
      this.approvedIdeas = ideas.filter((i) => i.status === 'Approved').length;

      // Calculate approval rate
      if (this.totalIdeas > 0) {
        this.approvalRate = Math.round(
          (this.approvedIdeas / this.totalIdeas) * 100,
        );
      }

      // Get 5 most recent ideas
      this.recentIdeas = ideas
        .sort((a, b) => {
          const dateA = new Date(a.submittedDate).getTime();
          const dateB = new Date(b.submittedDate).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
    });

    // Load categories
    this.categoryService.getAllCategories().subscribe((categories) => {
      this.totalCategories = categories.length;
      this.activeCategories = categories.filter((c) => c.isActive).length;
    });
  }

  loadRecentIdeas(): void {
    // Get 5 most recent ideas
    this.ideaService.getAllIdeas().subscribe((ideas) => {
      this.recentIdeas = ideas
        .sort((a, b) => {
          const dateA = new Date(a.submittedDate).getTime();
          const dateB = new Date(b.submittedDate).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
    });
  }

  loadRecentUsers(): void {
    // Get recent users
    this.userService.getAllUsers().subscribe((users) => {
      this.recentUsers = users.slice(0, 5);
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Rejected':
        return 'status-rejected';
      case 'UnderReview':
        return 'status-review';
      case 'Approved':
        return 'status-approved';
      default:
        return '';
    }
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'role-admin';
      case UserRole.MANAGER:
        return 'role-manager';
      case UserRole.EMPLOYEE:
        return 'role-employee';
      default:
        return '';
    }
  }
}
