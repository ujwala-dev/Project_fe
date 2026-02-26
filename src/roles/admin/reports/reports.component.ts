import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { IdeaService } from '../../../services/idea.service';
import { UserService } from '../../../services/user.service';
import { CategoryService } from '../../../services/category.service';
import {
  ReportsService,
  CategoryReport,
  IdeaStatusReport,
} from '../../../services/reports.service';
import { Chart, registerables } from 'chart.js';
import { Idea } from '../../../models/model';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  standalone: true,
})
export class ReportsComponent implements OnInit, AfterViewInit {

  // System Overview
  totalIdeas = 0;
  totalApproved = 0;
  totalRejected = 0;
  totalUnderReview = 0;
  totalUsers = 0;
  totalManagers = 0;
  totalEmployees = 0;
  totalAdmins = 0;
  totalCategories = 0;
  activeCategories = 0;
  approvalRate = 0;

  // Active tab
  activeTab: 'overview' | 'categories' | 'ideas' = 'overview';

  // Status Distribution
  statusDistribution: IdeaStatusReport[] = [];

  // Category Reports
  categoryReports: CategoryReport[] = [];

  // Top Categories
  topCategories: CategoryReport[] = [];

  // User Activity
  userActivity: any = null;

  // Employee Contributions
  employeeContributions: any[] = [];

  // Latest Ideas
  latestIdeas: Idea[] = [];

  // Loading states
  loadingOverview = true;
  loadingStatus = true;
  loadingCategories = true;
  loadingTopCategories = true;
  loadingUserActivity = true;
  loadingContributions = true;
  loadingLatestIdeas = true;
  exportingExcel = false;

  // Charts
  categoryChart: Chart | null = null;
  ideaStatusChart: Chart | null = null;
  contributionsChart: Chart | null = null;

  constructor(
    private ideaService: IdeaService,
    private userService: UserService,
    private categoryService: CategoryService,
    private reportsService: ReportsService,
  ) {}

  ngOnInit(): void {
    this.loadAllReports();
  }

  ngAfterViewInit(): void {
    // Initialize charts for the default tab after data loads
    setTimeout(() => this.reinitChartsForTab(), 300);
  }

  switchTab(tab: 'overview' | 'categories' | 'ideas'): void {
    this.activeTab = tab;
    setTimeout(() => this.reinitChartsForTab(), 100);
  }

  private reinitChartsForTab(): void {
    if (this.activeTab === 'overview') {
      if (this.statusDistribution.length > 0) {
        this.initializeIdeaStatusChart(this.statusDistribution);
      }
      if (this.employeeContributions.length > 0) {
        this.initializeContributionsChart();
      }
    } else if (this.activeTab === 'categories') {
      if (this.categoryReports.length > 0) {
        this.initializeCategoryChart();
      }
    }
  }

  // ── Load All Reports ──────────────────────────────────────────────

  loadAllReports(): void {
    this.loadSystemOverview();
    this.loadStatusDistribution();
    this.loadCategoryReports();
    this.loadTopCategories();
    this.loadUserActivity();
    this.loadEmployeeContributions();
    this.loadLatestIdeas();
  }

  // ── 1. GET /api/reports/system-overview ────────────────────────────

  loadSystemOverview(): void {
    this.loadingOverview = true;

    this.reportsService.getSystemOverview().subscribe({
      next: (report) => {
        this.totalIdeas = report.totalIdeas;
        this.totalApproved = report.totalApprovedIdeas;
        this.totalRejected = report.totalRejectedIdeas;
        this.totalUnderReview = report.totalUnderReviewIdeas;
        this.totalUsers = report.totalUsers;
        this.totalManagers = report.totalManagers;
        this.totalEmployees = report.totalEmployees;
        this.totalAdmins = report.totalAdmins;
        this.totalCategories = report.totalCategories;
        this.activeCategories = report.activeCategories;
        this.approvalRate = report.approvalRate;

        this.loadingOverview = false;
      },
      error: (error) => {
        console.error('Error loading system overview:', error);
        this.loadingOverview = false;
        this.loadSystemOverviewFallback();
      },
    });
  }

  loadSystemOverviewFallback(): void {
    this.ideaService.getAllIdeas().subscribe((ideas) => {
      this.totalIdeas = ideas.length;
      this.totalApproved = ideas.filter((i) => i.status === 'Approved').length;
      this.totalRejected = ideas.filter((i) => i.status === 'Rejected').length;
      this.totalUnderReview = ideas.filter((i) => i.status === 'UnderReview').length;
      this.approvalRate =
        this.totalIdeas > 0
          ? Math.round((this.totalApproved / this.totalIdeas) * 100)
          : 0;
    });

    this.userService.getAllUsers().subscribe((users) => {
      this.totalUsers = users.length;
    });
  }

  // ── 2. GET /api/reports/ideas/status-distribution ──────────────────

  loadStatusDistribution(): void {
    this.loadingStatus = true;

    this.reportsService.getIdeaStatusDistribution().subscribe({
      next: (distribution) => {
        this.statusDistribution = distribution;
        this.loadingStatus = false;

        setTimeout(() => this.initializeIdeaStatusChart(distribution), 100);
      },
      error: (error) => {
        console.error('Error loading status distribution:', error);
        this.loadingStatus = false;
      },
    });
  }

  // ── 3. GET /api/reports/categories ─────────────────────────────────

  loadCategoryReports(): void {
    this.loadingCategories = true;

    this.reportsService.getCategoryReports().subscribe({
      next: (reports) => {
        this.categoryReports = reports
          .filter((r) => r.ideasSubmitted > 0)
          .sort((a, b) => b.ideasSubmitted - a.ideasSubmitted);

        this.loadingCategories = false;

        setTimeout(() => this.initializeCategoryChart(), 100);
      },
      error: (error) => {
        console.error('Error loading category reports:', error);
        this.categoryReports = [];
        this.loadingCategories = false;
      },
    });
  }

  // ── 4. GET /api/reports/category/{categoryId} ──────────────────────

  selectedCategoryReport: CategoryReport | null = null;
  loadingCategoryDetail = false;

  loadCategoryDetail(categoryId: number | string): void {
    this.loadingCategoryDetail = true;

    this.reportsService.getCategoryReport(categoryId).subscribe({
      next: (report) => {
        this.selectedCategoryReport = report;
        this.loadingCategoryDetail = false;
      },
      error: (error) => {
        console.error('Error loading category detail:', error);
        this.selectedCategoryReport = null;
        this.loadingCategoryDetail = false;
      },
    });
  }

  closeCategoryDetail(): void {
    this.selectedCategoryReport = null;
  }

  // ── 5. GET /api/reports/users/activity ─────────────────────────────

  loadUserActivity(): void {
    this.loadingUserActivity = true;

    this.reportsService.getUserActivityReport().subscribe({
      next: (activity) => {
        this.userActivity = activity;
        this.loadingUserActivity = false;
      },
      error: (error) => {
        console.error('Error loading user activity:', error);
        this.loadingUserActivity = false;
      },
    });
  }

  // ── 6. GET /api/reports/top-categories ─────────────────────────────

  loadTopCategories(limit: number = 10): void {
    this.loadingTopCategories = true;

    this.reportsService.getTopCategories(limit).subscribe({
      next: (categories) => {
        this.topCategories = categories;
        this.loadingTopCategories = false;
      },
      error: (error) => {
        console.error('Error loading top categories:', error);
        this.topCategories = [];
        this.loadingTopCategories = false;
      },
    });
  }

  // ── 7. GET /api/reports/employee-contributions ─────────────────────

  loadEmployeeContributions(): void {
    this.loadingContributions = true;

    forkJoin({
      contributions: this.reportsService.getEmployeeContributions(),
      users: this.userService.getAllUsers(),
    }).subscribe({
      next: ({ contributions, users }) => {
        // Build a set of employee names (lowercase) for fast lookup
        const employeeNames = new Set(
          users
            .filter((u) => u.role?.toLowerCase() === 'employee')
            .map((u) => u.name?.toLowerCase())
        );

        this.employeeContributions = contributions.filter((c: any) => {
          const name = (c.employeeName || c.userName || c.name || '').toLowerCase();
          return employeeNames.has(name);
        });

        this.loadingContributions = false;
        setTimeout(() => this.initializeContributionsChart(), 100);
      },
      error: (error) => {
        console.error('Error loading employee contributions:', error);
        this.employeeContributions = [];
        this.loadingContributions = false;
      },
    });
  }

  // ── 9. GET /api/reports/ideas/latest ───────────────────────────────

  loadLatestIdeas(limit: number = 5): void {
    this.loadingLatestIdeas = true;

    this.reportsService.getRecentIdeas(limit).subscribe({
      next: (ideas) => {
        this.latestIdeas = ideas;
        this.loadingLatestIdeas = false;
      },
      error: (error) => {
        console.error('Error loading latest ideas:', error);
        this.latestIdeas = [];
        this.loadingLatestIdeas = false;
      },
    });
  }

  // ── 10. GET /api/reports/export/excel ──────────────────────────────

  exportToExcel(): void {
    this.exportingExcel = true;

    this.reportsService.exportReportsToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportingExcel = false;
      },
      error: (error) => {
        console.error('Error exporting to Excel:', error);
        this.exportingExcel = false;
      },
    });
  }

  // ── Charts ─────────────────────────────────────────────────────────

  initializeIdeaStatusChart(statusDistribution: IdeaStatusReport[]): void {
    const ctx = document.getElementById('ideaStatusChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.ideaStatusChart) {
      this.ideaStatusChart.destroy();
    }

    const labels = statusDistribution.map((s) => s.status);
    const data = statusDistribution.map((s) => s.count);
    const colors = labels.map((label) => {
      if (label === 'Approved') return '#10b981';
      if (label === 'Rejected') return '#ef4444';
      return '#f59e0b';
    });

    this.ideaStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: 500 },
              usePointStyle: true,
              padding: 20,
            },
          },
        },
      },
    });
  }

  initializeCategoryChart(): void {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.categoryReports.map((r) => r.categoryName),
        datasets: [
          {
            data: this.categoryReports.map((r) => r.ideasSubmitted),
            backgroundColor: this.categoryReports.map((_, i) => colors[i % colors.length]),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 11, weight: 500 },
              usePointStyle: true,
              padding: 14,
            },
          },
        },
      },
    });
  }

  initializeContributionsChart(): void {
    const ctx = document.getElementById('contributionsChart') as HTMLCanvasElement;
    if (!ctx || this.employeeContributions.length === 0) return;

    if (this.contributionsChart) {
      this.contributionsChart.destroy();
    }

    const top10 = this.employeeContributions.slice(0, 10);
    const labels = top10.map(
      (c) => c.employeeName || c.userName || c.name || 'Unknown'
    );
    const data = top10.map((c) => c.ideasSubmitted || c.totalIdeas || c.count || 0);

    this.contributionsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ideas Submitted',
            data,
            backgroundColor: '#3b82f6',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────

  getApprovalRate(approved: number, total: number): number {
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'UnderReview': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
