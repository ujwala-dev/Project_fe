import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeaService } from '../../../services/idea.service';
import { UserService } from '../../../services/user.service';
import { CategoryService } from '../../../services/category.service';
import {
  ReportsService,
  CategoryReport,
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
  categoryReports: CategoryReport[] = [];

  totalIdeas = 0;
  totalApproved = 0;
  totalUsers = 0;
  approvalRate = 0;

  categoryChart: Chart | null = null;
  ideaStatusChart: Chart | null = null;

  constructor(
    private ideaService: IdeaService,
    private userService: UserService,
    private categoryService: CategoryService,
    private reportsService: ReportsService,
  ) {}

  ngOnInit(): void {
    this.generateReports();
  }

  ngAfterViewInit(): void {
    // Charts are initialized in generateReports after data is loaded
  }

  generateReports(): void {
    // Load system overview from reports service
    this.reportsService.getSystemOverview().subscribe({
      next: (report) => {
        this.totalIdeas = report.totalIdeas;
        this.totalApproved = report.totalApprovedIdeas;
        this.totalUsers = report.totalUsers;
        this.approvalRate = report.approvalRate;

        // Initialize charts with data
        this.initializeIdeaStatusChart(report.ideaStatusDistribution);

        // Load category reports
        this.loadCategoryReports();
      },
      error: (error) => {
        console.error('Error loading system overview:', error);
        // Fallback to individual service calls
        this.generateReportsFallback();
      },
    });
  }

  generateReportsFallback(): void {
    this.ideaService.getAllIdeas().subscribe((ideas) => {
      this.totalIdeas = ideas.length;
      this.totalApproved = ideas.filter((i) => i.status === 'Approved').length;
      this.approvalRate =
        this.totalIdeas > 0
          ? Math.round((this.totalApproved / this.totalIdeas) * 100)
          : 0;

      this.initializeIdeaStatusChartFromIdeas(ideas);
    });

    this.userService.getAllUsers().subscribe((users) => {
      this.totalUsers = users.length;
    });

    this.loadCategoryReports();
  }

  loadCategoryReports(): void {
    this.reportsService.getCategoryReports().subscribe({
      next: (reports) => {
        this.categoryReports = reports
          .filter((r) => r.ideasSubmitted > 0)
          .sort((a, b) => b.ideasSubmitted - a.ideasSubmitted);

        setTimeout(() => {
          this.initializeCategoryChart();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading category reports:', error);
        this.categoryReports = [];
      },
    });
  }

  initializeCategoryChart(): void {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.categoryReports.map((r) => r.categoryName),
        datasets: [
          {
            data: this.categoryReports.map((r) => r.ideasSubmitted),
            backgroundColor: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#ec4899',
              '#14b8a6',
              '#f97316',
            ],
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
            position: 'right',
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

  initializeIdeaStatusChart(statusDistribution: any[]): void {
    const ctx = document.getElementById('ideaStatusChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.ideaStatusChart) {
      this.ideaStatusChart.destroy();
    }

    const approved =
      statusDistribution.find((s) => s.status === 'Approved')?.count || 0;
    const pending = this.totalIdeas - approved;

    this.ideaStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Approved', 'Pending'],
        datasets: [
          {
            data: [approved, pending],
            backgroundColor: ['#10b981', '#f59e0b'],
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

  initializeIdeaStatusChartFromIdeas(ideas: Idea[]): void {
    const approved = ideas.filter((i) => i.status === 'Approved').length;
    const pending = ideas.length - approved;

    const ctx = document.getElementById('ideaStatusChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.ideaStatusChart) {
      this.ideaStatusChart.destroy();
    }

    this.ideaStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Approved', 'Pending'],
        datasets: [
          {
            data: [approved, pending],
            backgroundColor: ['#10b981', '#f59e0b'],
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

  getApprovalRate(approved: number, total: number): number {
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }
}
