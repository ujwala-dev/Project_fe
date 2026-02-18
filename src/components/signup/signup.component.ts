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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        role: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
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

        // Handle new response structure
        if (response.success) {
          const message =
            response.message ||
            'Registration successful. Please check your email for next steps.';
          alert(message);
          this.router.navigate(['/signin']);
        } else {
          // Handle unsuccessful registration
          alert(response.message || 'Registration failed. Please try again.');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration error:', error);

        let errorMessage = 'Registration failed. Please try again.';

        // Handle different error types
        if (error.status === 0) {
          errorMessage =
            'Cannot connect to server. Please check:\n' +
            '1. Backend is running at https://localhost:7175\n' +
            '2. SSL certificate is trusted\n' +
            '3. CORS is configured on backend\n' +
            '4. Network connection is active';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }

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
    if (field.errors['notMatched']) {
      return 'Passwords do not match';
    }

    return 'Invalid field';
  }
}
