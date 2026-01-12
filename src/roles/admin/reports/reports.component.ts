import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeaService } from '../../../services/idea.service';
import { UserService } from '../../../services/user.service';
import { CategoryService } from '../../../services/category.service';


@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  standalone: true,
})
export class ReportsComponent implements OnInit {
  // Department Reports
  departmentReports: {
    department: string;
    ideasSubmitted: number;
    approvedIdeas: number;
    participationCount: number;
  }[] = [];

  // Category Reports
  categoryReports: {
    category: string;
    ideasSubmitted: number;
    approvedIdeas: number;
  }[] = [];

  // Overall Statistics
  totalIdeas = 0;
  totalApproved = 0;
  totalUsers = 0;
  approvalRate = 0;

  constructor(
    private ideaService: IdeaService,
    private userService: UserService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.generateReports();
  }

  generateReports(): void {
    // Get all data
    this.ideaService.getAllIdeas().subscribe((ideas) => {
      this.totalIdeas = ideas.length;
      this.totalApproved = ideas.filter((i) => i.status === 'Approved').length;
      this.approvalRate = this.totalIdeas > 0
        ? Math.round((this.totalApproved / this.totalIdeas) * 100)
        : 0;

      // Generate department reports
      this.userService.getAllUsers().subscribe((users) => {
        this.totalUsers = users.length;
        const departments = [...new Set(users.map((u) => u.department).filter((d) => d))];

        this.departmentReports = departments.map((dept) => {
          const deptUsers = users.filter((u) => u.department === dept);
          const deptUserIds = deptUsers.map((u) => u.userID);
          const deptIdeas = ideas.filter((i) => deptUserIds.includes(i.submittedByUserID));
          const deptApproved = deptIdeas.filter((i) => i.status === 'Approved');

          return {
            department: dept!,
            ideasSubmitted: deptIdeas.length,
            approvedIdeas: deptApproved.length,
            participationCount: deptUsers.filter((u) =>
              ideas.some((idea) => idea.submittedByUserID === u.userID)
            ).length,
          };
        }).sort((a, b) => b.ideasSubmitted - a.ideasSubmitted);
      });

      // Generate category reports
      this.categoryService.getAllCategories().subscribe((categories) => {
        this.categoryReports = categories.map((cat) => {
          const catIdeas = ideas.filter((i) => i.categoryID === cat.categoryID);
          const catApproved = catIdeas.filter((i) => i.status === 'Approved');

          return {
            category: cat.name,
            ideasSubmitted: catIdeas.length,
            approvedIdeas: catApproved.length,
          };
        }).filter(r => r.ideasSubmitted > 0)
          .sort((a, b) => b.ideasSubmitted - a.ideasSubmitted);
      });
    });
  }

  getApprovalRate(approved: number, total: number): number {
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }
}
