import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Idea, Category } from '../models/model';

export interface IdeaStatusReport {
  status: 'Approved' | 'Rejected' | 'UnderReview';
  count: number;
  percentage: number;
}

export interface CategoryReport {
  categoryID: number | string;
  categoryName: string;
  ideasSubmitted: number;
  approvedIdeas: number;
  rejectedIdeas: number;
  underReviewIdeas: number;
  approvalRate: number;
}

export interface SystemReport {
  totalIdeas: number;
  totalApprovedIdeas: number;
  totalRejectedIdeas: number;
  totalUnderReviewIdeas: number;
  totalUsers: number;
  totalManagers: number;
  totalEmployees: number;
  totalAdmins: number;
  totalCategories: number;
  activeCategories: number;
  approvalRate: number;
  ideaStatusDistribution: IdeaStatusReport[];
  categoryReports: CategoryReport[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = 'https://localhost:7175/api';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/reports/system-overview
   * Get comprehensive system statistics and overview
   */
  getSystemOverview(): Observable<SystemReport> {
    return this.http.get<any>(`${this.apiUrl}/reports/system-overview`).pipe(
      tap((report) => console.log('System overview:', report)),
      map((report) => this.mapSystemReport(report)),
    );
  }

  /**
   * GET /api/reports/ideas/status-distribution
   * Get ideas grouped by status
   */
  getIdeaStatusDistribution(): Observable<IdeaStatusReport[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/reports/ideas/status-distribution`)
      .pipe(
        tap((distribution) =>
          console.log('Idea status distribution:', distribution),
        ),
        map((items) =>
          items.map((item) => ({
            status: item.status as 'Approved' | 'Rejected' | 'UnderReview',
            count: item.count,
            percentage: item.percentage,
          })),
        ),
      );
  }

  /**
   * GET /api/reports/categories
   * Get reports for all categories with idea statistics
   */
  getCategoryReports(): Observable<CategoryReport[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/categories`).pipe(
      tap((reports) => console.log('Category reports:', reports)),
      map((reports) =>
        reports.map((report) => ({
          categoryID: report.categoryId,
          categoryName: report.categoryName,
          ideasSubmitted: report.ideasSubmitted,
          approvedIdeas: report.approvedIdeas,
          rejectedIdeas: report.rejectedIdeas,
          underReviewIdeas: report.underReviewIdeas,
          approvalRate: this.calculateApprovalRate(
            report.approvedIdeas,
            report.ideasSubmitted,
          ),
        })),
      ),
    );
  }

  /**
   * GET /api/reports/category/{categoryId}
   * Get detailed report for a specific category
   */
  getCategoryReport(categoryId: number | string): Observable<CategoryReport> {
    return this.http
      .get<any>(`${this.apiUrl}/reports/category/${categoryId}`)
      .pipe(
        tap((report) =>
          console.log(`Category report for ${categoryId}:`, report),
        ),
        map((report) => ({
          categoryID: report.categoryId,
          categoryName: report.categoryName,
          ideasSubmitted: report.ideasSubmitted,
          approvedIdeas: report.approvedIdeas,
          rejectedIdeas: report.rejectedIdeas,
          underReviewIdeas: report.underReviewIdeas,
          approvalRate: this.calculateApprovalRate(
            report.approvedIdeas,
            report.ideasSubmitted,
          ),
        })),
      );
  }

  /**
   * GET /api/reports/ideas/by-date
   * Get ideas submitted by date range for trend analysis
   */
  getIdeasByDateRange(startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.apiUrl}/reports/ideas/by-date`;
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      url += `?${params.toString()}`;
    }

    return this.http
      .get<any[]>(url)
      .pipe(tap((data) => console.log('Ideas by date:', data)));
  }

  /**
   * GET /api/reports/users/activity
   * Get user activity statistics and engagement metrics
   */
  getUserActivityReport(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/reports/users/activity`)
      .pipe(tap((report) => console.log('User activity report:', report)));
  }

  /**
   * GET /api/reports/top-categories
   * Get top performing categories by idea count or approval rate
   */
  getTopCategories(limit: number = 10): Observable<CategoryReport[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/reports/top-categories?limit=${limit}`)
      .pipe(
        tap((reports) => console.log('Top categories:', reports)),
        map((reports) =>
          reports.map((report) => ({
            categoryID: report.categoryId,
            categoryName: report.categoryName,
            ideasSubmitted: report.ideasSubmitted,
            approvedIdeas: report.approvedIdeas,
            rejectedIdeas: report.rejectedIdeas,
            underReviewIdeas: report.underReviewIdeas,
            approvalRate: this.calculateApprovalRate(
              report.approvedIdeas,
              report.ideasSubmitted,
            ),
          })),
        ),
      );
  }

  /**
   * GET /api/reports/approval-trends
   * Get approval rate trends over time
   */
  getApprovalTrends(months: number = 6): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/reports/approval-trends?months=${months}`)
      .pipe(tap((trends) => console.log('Approval trends:', trends)));
  }

  /**
   * GET /api/reports/employee-contributions
   * Get statistics on employee contributions and activity
   */
  getEmployeeContributions(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/reports/employee-contributions`)
      .pipe(
        tap((contributions) =>
          console.log('Employee contributions:', contributions),
        ),
      );
  }

  /**
   * GET /api/reports/export/excel
   * Export reports to Excel format (returns blob)
   */
  exportReportsToExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/export/excel`, {
      responseType: 'blob',
    });
  }

  /**
   * GET /api/reports/export/pdf
   * Export reports to PDF format (returns blob)
   */
  exportReportsToPdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/export/pdf`, {
      responseType: 'blob',
    });
  }

  // Helper methods

  private mapSystemReport(report: any): SystemReport {
    return {
      totalIdeas: report.totalIdeas,
      totalApprovedIdeas: report.totalApprovedIdeas,
      totalRejectedIdeas: report.totalRejectedIdeas,
      totalUnderReviewIdeas: report.totalUnderReviewIdeas,
      totalUsers: report.totalUsers,
      totalManagers: report.totalManagers,
      totalEmployees: report.totalEmployees,
      totalAdmins: report.totalAdmins,
      totalCategories: report.totalCategories,
      activeCategories: report.activeCategories,
      approvalRate: this.calculateApprovalRate(
        report.totalApprovedIdeas,
        report.totalIdeas,
      ),
      ideaStatusDistribution: (report.ideaStatusDistribution || []).map(
        (item: any) => ({
          status: item.status,
          count: item.count,
          percentage: item.percentage,
        }),
      ),
      categoryReports: (report.categoryReports || []).map((cat: any) => ({
        categoryID: cat.categoryId,
        categoryName: cat.categoryName,
        ideasSubmitted: cat.ideasSubmitted,
        approvedIdeas: cat.approvedIdeas,
        rejectedIdeas: cat.rejectedIdeas,
        underReviewIdeas: cat.underReviewIdeas,
        approvalRate: this.calculateApprovalRate(
          cat.approvedIdeas,
          cat.ideasSubmitted,
        ),
      })),
    };
  }

  private calculateApprovalRate(approved: number, total: number): number {
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }
}
