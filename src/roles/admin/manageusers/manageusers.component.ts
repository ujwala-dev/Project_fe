import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole } from '../../../models/model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-manageusers',
  imports: [CommonModule],
  templateUrl: './manageusers.component.html',
  styleUrl: './manageusers.component.css',
  standalone: true,
})
export class ManageusersComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe((users) => {
      this.users = users;
    });
  }

  toggleUserStatus(user: User): void {
    this.userService.toggleUserStatus(user.userID);
  }

  deleteUser(user: User): void {
    if (
      confirm(
        `Are you sure you want to delete "${user.name}"? This action cannot be undone.`
      )
    ) {
      this.userService.deleteUser(user.userID);
    }
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
}
