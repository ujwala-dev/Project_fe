import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/model';
import {
  UserService,
  UserStatistics,
  UserDetails,
} from '../../../services/user.service';

@Component({
  selector: 'app-manageusers',
  imports: [CommonModule, FormsModule],
  templateUrl: './manageusers.component.html',
  styleUrl: './manageusers.component.css',
  standalone: true,
})
export class ManageusersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  statistics: UserStatistics | null = null;
  isLoading = false;
  selectedUser: UserDetails | null = null;
  showUserDetails = false;

  showStatusConfirm = false;
  targetUser: User | null = null;
  targetStatus: 'Active' | 'Inactive' | null = null;
  isUpdatingStatus = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastTimer: any;
  toastOffset = 72;

  // Filter options
  filterRole: UserRole | 'All' = 'All';
  filterStatus: 'Active' | 'Inactive' | 'All' = 'All';
  searchTerm = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStatistics();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showToast('Failed to load users. Please try again.', 'error');
        this.isLoading = false;
      },
    });
  }

  loadStatistics(): void {
    this.userService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.showToast('Unable to load stats right now.', 'error');
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.users];

    // Filter by status (role filtering is done via API in onFilterChange)
    if (this.filterStatus !== 'All') {
      filtered = filtered.filter((u) => u.status === this.filterStatus);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      );
    }

    this.filteredUsers = filtered;
  }

  onFilterChange(): void {
    // If filtering by role, use the API endpoint for better performance
    if (this.filterRole !== 'All') {
      console.log('Fetching users by role:', this.filterRole);
      this.userService.getUsersByRole(this.filterRole as UserRole).subscribe({
        next: (users) => {
          console.log('Users fetched by role:', users);
          this.users = users;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading users by role:', error);
          this.applyFilters(); // Fallback to local filtering
        },
      });
    } else {
      // If "All" is selected, reload all users
      this.loadUsers();
    }
  }

  onSearch(): void {
    // Always use local filtering for search - don't call API
    this.applyFilters();
  }

  openStatusConfirm(user: User): void {
    this.targetUser = user;
    this.targetStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    this.showStatusConfirm = true;
  }

  cancelStatusConfirm(force = false): void {
    if (this.isUpdatingStatus && !force) return;
    this.showStatusConfirm = false;
    this.targetUser = null;
    this.targetStatus = null;
  }

  confirmStatusChange(): void {
    if (!this.targetUser || !this.targetStatus || this.isUpdatingStatus) {
      return;
    }

    const statusToApply = this.targetStatus;
    this.isUpdatingStatus = true;
    this.userService.toggleUserStatus(this.targetUser.userID, statusToApply).subscribe({
      next: () => {
        this.loadUsers();
        this.loadStatistics();
        this.cancelStatusConfirm(true);
        this.showToast(
          statusToApply === 'Active'
            ? 'User activated successfully'
            : 'User deactivated successfully',
          'success',
        );
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        if (
          error.status === 400 &&
          error.error?.message?.includes('deactivate your own')
        ) {
          this.showToast('You cannot deactivate your own account.', 'error');
        } else if (error.status === 400 && error.error?.message?.includes('last admin')) {
          this.showToast(
            'Cannot deactivate the last active admin. Please ensure at least one admin remains active.',
            'error',
          );
        } else {
          this.showToast(
            'Cannot deactivate the last active admin. Please ensure at least one admin remains active.',
            'error',
          );
        }
        this.isUpdatingStatus = false;
        this.cancelStatusConfirm(true);
      },
      complete: () => {
        this.isUpdatingStatus = false;
      },
    });
  }

  activateUser(user: User): void {
    this.userService.activateUser(user.userID).subscribe({
      next: () => {
        this.loadUsers();
        this.loadStatistics();
        this.showToast('User activated successfully', 'success');
      },
      error: (error) => {
        console.error('Error activating user:', error);
        this.showToast('Failed to activate user. Please try again.', 'error');
      },
    });
  }

  deactivateUser(user: User): void {
    if (confirm(`Are you sure you want to deactivate "${user.name}"?`)) {
      this.userService.deactivateUser(user.userID).subscribe({
        next: () => {
          this.loadUsers();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error deactivating user:', error);
          if (
            error.status === 400 &&
            error.error?.message?.includes('deactivate your own')
          ) {
            this.showToast('You cannot deactivate your own account!', 'error');
          } else {
            this.showToast('Failed to deactivate user. Please try again.', 'error');
          }
        },
      });
    }
  }

  viewUserDetails(user: User): void {
    this.userService.getUserById(user.userID).subscribe({
      next: (details) => {
        this.selectedUser = details;
        this.showUserDetails = true;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.showToast('Failed to load user details. Please try again.', 'error');
      },
    });
  }

  closeUserDetails(): void {
    this.showUserDetails = false;
    this.selectedUser = null;
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-900';
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-900';
      case UserRole.EMPLOYEE:
        return 'bg-green-100 text-green-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  }

  getStatusClass(status: 'Active' | 'Inactive'): string {
    return status === 'Active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  private showToast(
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ): void {
    this.toastMessage = message;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 2600);
  }
}
