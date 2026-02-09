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
      next: (user) => {
        this.loading = false;

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
        const errorMessage =
          error.error?.message ||
          error.error ||
          'Invalid credentials. Please try again.';
        alert(errorMessage);
        console.error('Login error:', error);
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
