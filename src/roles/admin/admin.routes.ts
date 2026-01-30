import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CategoryListComponent } from './category-form/category-list/category-list.component';
import { ManageusersComponent } from './manageusers/manageusers.component';
import { ReportsComponent } from './reports/reports.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'categories', component: CategoryListComponent },
      { path: 'manageusers', component: ManageusersComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'admin', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
