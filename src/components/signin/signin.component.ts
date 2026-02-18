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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
        console.error('Full login error object:', error);
        console.error('Error status:', error.status);
        console.error('Error error:', error.error);
        console.error('Error message:', error.message);

        let errorMessage = 'Login failed. Please try again.';

        // Handle different error types
        if (error.status === 0) {
          errorMessage =
            'Cannot connect to server. Please check:\n' +
            '1. Backend is running at https://localhost:7175\n' +
            '2. SSL certificate is trusted\n' +
            '3. CORS is configured on backend\n' +
            '4. Network connection is active';
        } else if (error.error?.success === false) {
          errorMessage =
            error.error?.message || 'Login failed. Please try again.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error('Final error message:', errorMessage);
        alert(errorMessage);
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
      return (
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' is required'
      );
    }
    if (field.errors['minlength']) {
      return (
        'Minimum ' +
        field.errors['minlength'].requiredLength +
        ' characters needed'
      );
    }
    if (field.errors['email']) {
      return 'Please enter a valid email';
    }

    return 'Invalid field';
  }
}
