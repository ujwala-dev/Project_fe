import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  form: FormGroup;
  submitted = false;
  loading = false;
  showPass = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100),
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
      ]],
    });
  }

  togglePassword() {
    this.showPass = !this.showPass;
  }

  submit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    const data = this.form.value;

    this.authService.loginWithCredentials(data.email, data.password).subscribe({
      next: (user: any) => {
        this.loading = false;
        console.log('Login successful, user:', user);

        // User object is returned directly from auth service
        const role = String(user.role).toLowerCase();

        if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'manager') {
          this.router.navigate(['/manager/dashboard']);
        } else {
          this.router.navigate(['/employee/dashboard']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Login error:', error.status, error.error);

        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please try again later.';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else if (error.status === 403) {
          this.errorMessage = 'Your account is deactivated. Please contact the admin.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      },
    });
  }

  getControl(fieldName: string) {
    return this.form.get(fieldName);
  }

  isInvalid(fieldName: string): boolean {
    const field = this.getControl(fieldName);
    return !!(
      field &&
      field.invalid &&
      (field.dirty || field.touched || this.submitted)
    );
  }

  getError(fieldName: string): string {
    const field = this.getControl(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' is required.';
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address.';
    }
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} characters required.`;
    }
    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed.`;
    }

    return 'Invalid field.';
  }
}
