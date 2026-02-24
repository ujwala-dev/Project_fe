import { AuthService } from './../../services/auth.service';

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  form: FormGroup;
  submitted = false;
  loading = false;
  showPass = false;
  showConfirmPass = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group(
      {
        name: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern('^[a-zA-Z ]*$'),
        ]],
        email: ['', [
          Validators.required,
          Validators.email,
          Validators.maxLength(100),
        ]],
        role: ['', Validators.required],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          Validators.pattern('^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).+$'),
        ]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.checkPasswordMatch },
    );
  }

  checkPasswordMatch = (formGroup: FormGroup) => {
    const pass = formGroup.get('password');
    const confirmPass = formGroup.get('confirmPassword');

    if (pass && confirmPass && pass.value !== confirmPass.value) {
      confirmPass.setErrors({ notMatched: true });
    }
    return null;
  };

  togglePassword() {
    this.showPass = !this.showPass;
  }

  toggleConfirmPassword() {
    this.showConfirmPass = !this.showConfirmPass;
  }
  submit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    const data = this.form.value;

    const registerPayload = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    };

    this.authService.register(registerPayload).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.errorMessage = '';

        // Handle new response structure
        if (response.success) {
          this.successMessage =
            response.message ||
            'Registration successful. Please check your email for next steps.';
          setTimeout(() => this.router.navigate(['/signin']), 1500);
        } else {
          // Handle unsuccessful registration
          this.errorMessage = response.message || 'Registration failed. Please try again.';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration error:', error);

        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please try again later.';
        } else if (error.status === 409) {
          this.errorMessage = 'This email is already registered. Please sign in.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
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
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} characters required.`;
    }
    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed.`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address.';
    }
    if (field.errors['pattern'] && fieldName === 'name') {
      return 'Name can only contain letters and spaces.';
    }
    if (field.errors['pattern'] && fieldName === 'password') {
      return 'Password must have at least 1 uppercase letter, 1 number, and 1 special character (!@#$%^&*).';
    }
    if (field.errors['notMatched']) {
      return 'Passwords do not match.';
    }

    return 'Invalid field.';
  }
}
