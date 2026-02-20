# Admin Dashboard & Reports System - Backend API Documentation

## Overview
Complete API documentation for the Admin Dashboard and Reports system. This document provides all endpoints required to implement the dashboard and reports functionality.

---

## Base URL
```
https://localhost:7175/api
```

---

## 1. System Overview Endpoint

### GET /api/reports/system-overview
Get comprehensive system statistics and overview data.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/system-overview HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "totalIdeas": 150,
  "totalApprovedIdeas": 90,
  "totalRejectedIdeas": 30,
  "totalUnderReviewIdeas": 30,
  "totalUsers": 45,
  "totalManagers": 5,
  "totalEmployees": 35,
  "totalAdmins": 5,
  "totalCategories": 8,
  "activeCategories": 7,
  "approvalRate": 60,
  "ideaStatusDistribution": [
    {
      "status": "Approved",
      "count": 90,
      "percentage": 60
    },
    {
      "status": "Rejected",
      "count": 30,
      "percentage": 20
    },
    {
      "status": "UnderReview",
      "count": 30,
      "percentage": 20
    }
  ],
  "categoryReports": [
    {
      "categoryId": "uuid-1",
      "categoryName": "Technology",
      "ideasSubmitted": 45,
      "approvedIdeas": 28,
      "rejectedIdeas": 8,
      "underReviewIdeas": 9,
      "approvalRate": 62
    },
    {
      "categoryId": "uuid-2",
      "categoryName": "Innovation",
      "ideasSubmitted": 32,
      "approvedIdeas": 18,
      "rejectedIdeas": 7,
      "underReviewIdeas": 7,
      "approvalRate": 56
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Authorization required",
  "statusCode": 401
}
```

---

## 2. Idea Status Distribution

### GET /api/reports/ideas/status-distribution
Get ideas grouped by approval status with percentages.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/ideas/status-distribution HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "status": "Approved",
    "count": 90,
    "percentage": 60
  },
  {
    "status": "Rejected",
    "count": 30,
    "percentage": 20
  },
  {
    "status": "UnderReview",
    "count": 30,
    "percentage": 20
  }
]
```

---

## 3. Category Reports

### GET /api/reports/categories
Get reports for all categories with idea statistics.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/categories HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "categoryId": "uuid-1",
    "categoryName": "Technology",
    "ideasSubmitted": 45,
    "approvedIdeas": 28,
    "rejectedIdeas": 8,
    "underReviewIdeas": 9
  },
  {
    "categoryId": "uuid-2",
    "categoryName": "Innovation",
    "ideasSubmitted": 32,
    "approvedIdeas": 18,
    "rejectedIdeas": 7,
    "underReviewIdeas": 7
  },
  {
    "categoryId": "uuid-3",
    "categoryName": "Process Improvement",
    "ideasSubmitted": 25,
    "approvedIdeas": 14,
    "rejectedIdeas": 6,
    "underReviewIdeas": 5
  }
]
```

---

## 4. Single Category Report

### GET /api/reports/category/{categoryId}
Get detailed report for a specific category.

**Authorization:** Required (Admin Role)

**Parameters:**
- `categoryId` (path): UUID of the category

**Request:**
```http
GET /api/reports/category/uuid-1 HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "categoryId": "uuid-1",
  "categoryName": "Technology",
  "ideasSubmitted": 45,
  "approvedIdeas": 28,
  "rejectedIdeas": 8,
  "underReviewIdeas": 9,
  "lastUpdated": "2026-02-20T10:30:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Category not found",
  "statusCode": 404
}
```

---

## 5. Ideas by Date Range

### GET /api/reports/ideas/by-date
Get ideas submitted by date range for trend analysis.

**Authorization:** Required (Admin Role)

**Query Parameters:**
- `startDate` (optional): Start date (ISO 8601 format: YYYY-MM-DD)
- `endDate` (optional): End date (ISO 8601 format: YYYY-MM-DD)

**Request:**
```http
GET /api/reports/ideas/by-date?startDate=2026-01-01&endDate=2026-02-20 HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "date": "2026-02-15",
    "ideasSubmitted": 8,
    "ideasApproved": 5,
    "ideasRejected": 2,
    "ideasUnderReview": 1
  },
  {
    "date": "2026-02-16",
    "ideasSubmitted": 12,
    "ideasApproved": 7,
    "ideasRejected": 3,
    "ideasUnderReview": 2
  },
  {
    "date": "2026-02-17",
    "ideasSubmitted": 10,
    "ideasApproved": 6,
    "ideasRejected": 2,
    "ideasUnderReview": 2
  }
]
```

---

## 6. User Activity Report

### GET /api/reports/users/activity
Get user activity statistics and engagement metrics.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/users/activity HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "totalUsers": 45,
  "activeUsers": 38,
  "inactiveUsers": 7,
  "usersWithIdeas": 30,
  "usersWithReviews": 5,
  "usersWithComments": 25,
  "usersWithVotes": 35,
  "averageIdeasPerUser": 3.33,
  "averageCommentsPerUser": 5.2,
  "engagementRate": 84.4
}
```

---

## 7. Top Categories

### GET /api/reports/top-categories
Get top performing categories by idea count or approval rate.

**Authorization:** Required (Admin Role)

**Query Parameters:**
- `limit` (optional, default: 10): Number of top categories to return

**Request:**
```http
GET /api/reports/top-categories?limit=5 HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "categoryId": "uuid-1",
    "categoryName": "Technology",
    "ideasSubmitted": 45,
    "approvedIdeas": 28,
    "rejectedIdeas": 8,
    "underReviewIdeas": 9
  },
  {
    "categoryId": "uuid-2",
    "categoryName": "Innovation",
    "ideasSubmitted": 32,
    "approvedIdeas": 18,
    "rejectedIdeas": 7,
    "underReviewIdeas": 7
  },
  {
    "categoryId": "uuid-3",
    "categoryName": "Process Improvement",
    "ideasSubmitted": 25,
    "approvedIdeas": 14,
    "rejectedIdeas": 6,
    "underReviewIdeas": 5
  },
  {
    "categoryId": "uuid-4",
    "categoryName": "Customer Experience",
    "ideasSubmitted": 22,
    "approvedIdeas": 15,
    "rejectedIdeas": 4,
    "underReviewIdeas": 3
  },
  {
    "categoryId": "uuid-5",
    "categoryName": "Cost Reduction",
    "ideasSubmitted": 18,
    "approvedIdeas": 12,
    "rejectedIdeas": 3,
    "underReviewIdeas": 3
  }
]
```

---

## 8. Approval Trends

### GET /api/reports/approval-trends
Get approval rate trends over time.

**Authorization:** Required (Admin Role)

**Query Parameters:**
- `months` (optional, default: 6): Number of months to retrieve data for

**Request:**
```http
GET /api/reports/approval-trends?months=6 HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "month": "2025-09",
    "ideasSubmitted": 120,
    "ideasApproved": 65,
    "approvalRate": 54.2
  },
  {
    "month": "2025-10",
    "ideasSubmitted": 135,
    "ideasApproved": 82,
    "approvalRate": 60.7
  },
  {
    "month": "2025-11",
    "ideasSubmitted": 145,
    "ideasApproved": 88,
    "approvalRate": 60.7
  },
  {
    "month": "2025-12",
    "ideasSubmitted": 125,
    "ideasApproved": 75,
    "approvalRate": 60
  },
  {
    "month": "2026-01",
    "ideasSubmitted": 140,
    "ideasApproved": 84,
    "approvalRate": 60
  },
  {
    "month": "2026-02",
    "ideasSubmitted": 155,
    "ideasApproved": 93,
    "approvalRate": 60
  }
]
```

---

## 9. Employee Contributions

### GET /api/reports/employee-contributions
Get statistics on employee contributions and activity.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/employee-contributions HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "userId": "uuid-1",
    "userName": "John Smith",
    "department": "Engineering",
    "ideasSubmitted": 8,
    "ideasApproved": 5,
    "commentsPosted": 23,
    "votesGiven": 45,
    "totalEngagementScore": 81
  },
  {
    "userId": "uuid-2",
    "userName": "Sarah Johnson",
    "department": "Marketing",
    "ideasSubmitted": 6,
    "ideasApproved": 3,
    "commentsPosted": 18,
    "votesGiven": 32,
    "totalEngagementScore": 59
  },
  {
    "userId": "uuid-3",
    "userName": "Mike Davis",
    "department": "Finance",
    "ideasSubmitted": 4,
    "ideasApproved": 2,
    "commentsPosted": 12,
    "votesGiven": 25,
    "totalEngagementScore": 43
  }
]
```

---

## 10. Export Reports (Excel)

### GET /api/reports/export/excel
Export all reports data to Excel format.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/export/excel HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="reports-2026-02-20.xlsx"`
- Body: Binary Excel file

**Error Response (500 Internal Server Error):**
```json
{
  "message": "Error generating Excel file",
  "statusCode": 500
}
```

---

## 11. Export Reports (PDF)

### GET /api/reports/export/pdf
Export all reports data to PDF format.

**Authorization:** Required (Admin Role)

**Request:**
```http
GET /api/reports/export/pdf HTTP/1.1
Host: localhost:7175
Authorization: Bearer {token}
```

**Response (200 OK):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="reports-2026-02-20.pdf"`
- Body: Binary PDF file

**Error Response (500 Internal Server Error):**
```json
{
  "message": "Error generating PDF file",
  "statusCode": 500
}
```

---

## Existing User-Related Endpoints

### GET /api/usermanagement/users
Get all users from the system.

**Authorization:** Required (Admin Role)

**Response (200 OK):**
```json
[
  {
    "userId": "uuid-1",
    "name": "John Smith",
    "email": "john@company.com",
    "role": "employee",
    "department": "Engineering",
    "status": "Active"
  },
  {
    "userId": "uuid-2",
    "name": "Sarah Johnson",
    "email": "sarah@company.com",
    "role": "manager",
    "department": "Marketing",
    "status": "Active"
  },
  {
    "userId": "uuid-3",
    "name": "Admin User",
    "email": "admin@company.com",
    "role": "admin",
    "department": "Executive",
    "status": "Active"
  }
]
```

---

## Existing Category-Related Endpoints

### GET /api/Categorie/categories
Get all categories from the system.

**Response (200 OK):**
```json
[
  {
    "categoryId": "uuid-1",
    "name": "Technology",
    "description": "Technology and digital innovation ideas",
    "isActive": true
  },
  {
    "categoryId": "uuid-2",
    "name": "Innovation",
    "description": "New business models and innovation",
    "isActive": true
  },
  {
    "categoryId": "uuid-3",
    "name": "Process Improvement",
    "description": "Process optimization ideas",
    "isActive": true
  }
]
```

---

## Existing Ideas-Related Endpoints

### GET /api/Idea/all
Get all ideas from the system.

**Response (200 OK):**
```json
[
  {
    "ideaId": "uuid-1",
    "title": "AI-Powered Analytics",
    "description": "Implement AI for data analytics",
    "categoryId": "uuid-1",
    "categoryName": "Technology",
    "userId": "uuid-1",
    "submittedByUserName": "John Smith",
    "submittedDate": "2026-02-15T10:30:00Z",
    "status": "Approved",
    "upvotes": 25,
    "downvotes": 2,
    "reviewedByUserId": "uuid-2",
    "reviewedByUserName": "Sarah Manager"
  },
  {
    "ideaId": "uuid-2",
    "title": "Mobile App Redesign",
    "description": "Redesign mobile application UI/UX",
    "categoryId": "uuid-2",
    "categoryName": "Innovation",
    "userId": "uuid-3",
    "submittedByUserName": "Mike Davis",
    "submittedDate": "2026-02-16T14:20:00Z",
    "status": "UnderReview",
    "upvotes": 18,
    "downvotes": 1,
    "reviewedByUserId": null,
    "reviewedByUserName": null
  }
]
```

---

## Data Types

### User Object
```typescript
{
  userId: string;          // UUID
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  department?: string;
  status: "Active" | "Inactive";
}
```

### Category Object
```typescript
{
  categoryId: string;      // UUID
  name: string;
  description?: string;
  isActive: boolean;
}
```

### Idea Object
```typescript
{
  ideaId: string;          // UUID
  title: string;
  description: string;
  categoryId: string;      // UUID
  categoryName: string;
  userId: string;          // UUID
  submittedByUserName: string;
  submittedDate: string;   // ISO 8601
  status: "Approved" | "Rejected" | "UnderReview";
  upvotes: number;
  downvotes: number;
  reviewedByUserId?: string;  // UUID
  reviewedByUserName?: string;
}
```

### CategoryReport Object
```typescript
{
  categoryId: string;
  categoryName: string;
  ideasSubmitted: number;
  approvedIdeas: number;
  rejectedIdeas: number;
  underReviewIdeas: number;
}
```

### SystemReport Object
```typescript
{
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
  approvalRate: number;           // Percentage 0-100
  ideaStatusDistribution: Array;
  categoryReports: Array;
}
```

---

## Common Response Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found |
| 500  | Internal Server Error |

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400,
  "details": "Additional error details (optional)"
}
```

---

## Implementation Notes

### Frontend Implementation (Already Done)

1. **Reports Service** (`reports.service.ts`):
   - All 11 endpoints are implemented
   - Includes proper error handling
   - Automatic data mapping from backend format to frontend models
   - Helper methods for calculations

2. **Reports Component** (`reports.component.ts`):
   - Fetches system overview
   - Generates charts for idea distribution and category distribution
   - Falls back to individual service calls if system overview fails
   - Displays category reports in table format

3. **Dashboard Component** (`dashboard.component.ts`):
   - Uses reports service for system overview
   - Falls back to individual service calls
   - Displays recent ideas and users
   - Shows aggregated statistics

### Backend Implementation (Required)

Implement the following endpoints in the backend:

- `GET /api/reports/system-overview`
- `GET /api/reports/ideas/status-distribution`
- `GET /api/reports/categories`
- `GET /api/reports/category/{categoryId}`
- `GET /api/reports/ideas/by-date`
- `GET /api/reports/users/activity`
- `GET /api/reports/top-categories`
- `GET /api/reports/approval-trends`
- `GET /api/reports/employee-contributions`
- `GET /api/reports/export/excel`
- `GET /api/reports/export/pdf`

All endpoints require admin authentication and should follow RESTful principles.

---

## Usage Examples

### Frontend Service Usage

```typescript
// Get system overview
this.reportsService.getSystemOverview().subscribe(report => {
  console.log('Total ideas:', report.totalIdeas);
  console.log('Approval rate:', report.approvalRate);
});

// Get category reports
this.reportsService.getCategoryReports().subscribe(reports => {
  console.log('Category reports:', reports);
});

// Get ideas by date range
this.reportsService.getIdeasByDateRange('2026-01-01', '2026-02-28').subscribe(data => {
  console.log('Trend data:', data);
});

// Export to Excel
this.reportsService.exportReportsToExcel().subscribe(blob => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reports.xlsx';
  link.click();
});
```

---

## Version History

- **v1.0** (2026-02-20): Initial API documentation for Admin Dashboard and Reports system
