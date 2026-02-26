import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { IdeaService } from '../../../services/idea.service';
import { AuthService } from '../../../services/auth.service';
import { UserRole, Category } from '../../../models/model';
import { CategoryService } from '../../../services/category.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-createidea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './createidea.component.html',
  styleUrl: './createidea.component.css',
})
export class CreateideaComponent implements OnInit {
  form!: FormGroup;
  categories: Category[] = [];
  currentRole: UserRole | null = null;
  currentUserId = 0;
  // Toast state
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastTimer: any;
  toastOffset = 72;

  constructor(
    private fb: FormBuilder,
    private ideaService: IdeaService,
    private router: Router,
    private authService: AuthService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
  ) {
    this.form = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(200),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(100),
        ],
      ],
      categoryID: ['', Validators.required],
      status: ['UnderReview'],
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentRole = user.role;
      this.currentUserId = user.userID;
    }
    // Load active categories
    this.categoryService.getAllCategories().subscribe((categories) => {
      this.categories = categories.filter((c) => c.isActive);
    });
  }

  submit() {
    if (this.form.invalid) {
      console.log('Form is invalid:', this.form.errors);
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control?.invalid) {
          console.log(`${key} errors:`, control.errors);
        }
      });
      return;
    }

    const categoryID = this.form.value.categoryID;

    if (!categoryID) {
      alert('Please select a valid category');
      return;
    }

    const payload: any = {
      title: this.form.value.title?.trim(),
      description: this.form.value.description?.trim(),
      categoryID: categoryID, // Keep as string (GUID)
    };

    console.log('Submitting idea with payload:', payload);
    console.log('Form values:', this.form.value);

    this.ideaService.createIdea(payload).subscribe({
      next: (response) => {
        console.log('Idea created successfully:', response);
        // Trigger immediate notification refresh for managers
        setTimeout(() => {
          this.notificationService.refresh();
        }, 1000); // Small delay to ensure backend has created notifications
        this.showToast('Idea submitted successfully!', 'success');
        setTimeout(() => {
          this.router.navigate(['employee/dashboard']);
        }, 1200);
      },
      error: (error) => {
        console.error('Full error details:', error);
        console.error('Error status:', error.status);
        console.error('Error error object:', error.error);

        let errorMsg = 'Failed to submit idea. Please try again.';

        if (error.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.error.message) {
            errorMsg = error.error.message;
          } else if (error.error.title) {
            errorMsg = error.error.title;
          } else {
            errorMsg = JSON.stringify(error.error);
          }
        } else if (error.message) {
          errorMsg = error.message;
        }

        this.showToast(errorMsg, 'error');
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 2000);
  }
}
