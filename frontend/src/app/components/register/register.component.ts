import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <!-- Modern Header Section -->
      <div class="modern-header">
        <div class="header-content">
          <div class="logo-section">
            <mat-icon class="club-logo">sports_tennis</mat-icon>
            <div class="club-info">
              <h1 class="club-title">Rich Town 2 Tennis Club</h1>
              <p class="club-tagline">Premium Tennis Experience</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Page Content -->
      <div class="page-content">
        <div class="content-wrapper">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <h2 class="welcome-title">
              <mat-icon>person_add</mat-icon>
              Create Your Account
            </h2>
            <p class="welcome-subtitle">
              Join our tennis community and start your journey with us
            </p>
          </div>
          
          <!-- Registration Card -->
          <div class="action-card register-form-card">
            <!-- Membership Information -->
            <div class="info-section">
              <mat-icon class="info-icon">info</mat-icon>
              <div class="info-content">
                <h3>Membership Requirements</h3>
                <ul>
                  <li>Membership fee payment required before account approval</li>
                  <li>Your account will be reviewed by an administrator</li>
                  <li>New members receive 100 free coins to get started</li>
                  <li>Coins are required to use the application features</li>
                </ul>
              </div>
            </div>
            
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
              <!-- Personal Information -->
              <h3 class="section-title">Personal Information</h3>
              
              <div class="form-field">
                <label for="fullName" class="form-label">
                  <mat-icon>person</mat-icon>
                  Full Name
                </label>
                <input 
                  id="fullName"
                  type="text"
                  class="form-input"
                  formControlName="fullName" 
                  placeholder="Enter your full name"
                  [class.error]="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched">
                <div class="form-errors" *ngIf="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched">
                  <div class="error-message" *ngIf="registerForm.get('fullName')?.hasError('required')">
                    <mat-icon>error</mat-icon>
                    Full name is required
                  </div>
                  <div class="error-message" *ngIf="registerForm.get('fullName')?.hasError('minlength')">
                    <mat-icon>error</mat-icon>
                    Full name must be at least 2 characters
                  </div>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-field half-width">
                  <label for="username" class="form-label">
                    <mat-icon>account_circle</mat-icon>
                    Username
                  </label>
                  <input 
                    id="username"
                    type="text"
                    class="form-input"
                    formControlName="username" 
                    placeholder="FirstnameLastname format"
                    [class.error]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
                  <div class="form-hint">Format: FirstnameLastname (e.g., JohnSmith)</div>
                  <div class="form-errors" *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
                    <div class="error-message" *ngIf="registerForm.get('username')?.hasError('required')">
                      <mat-icon>error</mat-icon>
                      Username is required
                    </div>
                    <div class="error-message" *ngIf="registerForm.get('username')?.hasError('pattern')">
                      <mat-icon>error</mat-icon>
                      Use FirstnameLastname format (no spaces or special characters)
                    </div>
                  </div>
                </div>
                
                <div class="form-field half-width">
                  <label for="gender" class="form-label">
                    <mat-icon>wc</mat-icon>
                    Gender
                  </label>
                  <select 
                    id="gender"
                    class="form-input form-select"
                    formControlName="gender"
                    [class.error]="registerForm.get('gender')?.invalid && registerForm.get('gender')?.touched">
                    <option value="" disabled>Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <div class="form-errors" *ngIf="registerForm.get('gender')?.invalid && registerForm.get('gender')?.touched">
                    <div class="error-message" *ngIf="registerForm.get('gender')?.hasError('required')">
                      <mat-icon>error</mat-icon>
                      Please select your gender
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="form-field">
                <label for="email" class="form-label">
                  <mat-icon>email</mat-icon>
                  Email Address
                </label>
                <input 
                  id="email"
                  type="email"
                  class="form-input"
                  formControlName="email" 
                  placeholder="Enter your email address"
                  [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                <div class="form-errors" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                  <div class="error-message" *ngIf="registerForm.get('email')?.hasError('required')">
                    <mat-icon>error</mat-icon>
                    Email is required
                  </div>
                  <div class="error-message" *ngIf="registerForm.get('email')?.hasError('email')">
                    <mat-icon>error</mat-icon>
                    Please enter a valid email address
                  </div>
                </div>
              </div>
              
              <!-- Account Security -->
              <h3 class="section-title">Account Security</h3>
              
              <div class="form-field">
                <label for="password" class="form-label">
                  <mat-icon>lock</mat-icon>
                  Password
                </label>
                <div class="input-with-button">
                  <input 
                    id="password"
                    [type]="hidePassword ? 'password' : 'text'"
                    class="form-input"
                    formControlName="password"
                    placeholder="Create a strong password"
                    [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                  <button 
                    type="button"
                    class="input-button"
                    (click)="hidePassword = !hidePassword">
                    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </div>
                <div class="form-hint">Password must be at least 6 characters long</div>
                <div class="form-errors" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                  <div class="error-message" *ngIf="registerForm.get('password')?.hasError('required')">
                    <mat-icon>error</mat-icon>
                    Password is required
                  </div>
                  <div class="error-message" *ngIf="registerForm.get('password')?.hasError('minlength')">
                    <mat-icon>error</mat-icon>
                    Password must be at least 6 characters long
                  </div>
                </div>
              </div>
              
              <div class="form-field">
                <label for="confirmPassword" class="form-label">
                  <mat-icon>lock_outline</mat-icon>
                  Confirm Password
                </label>
                <div class="input-with-button">
                  <input 
                    id="confirmPassword"
                    [type]="hideConfirmPassword ? 'password' : 'text'"
                    class="form-input"
                    formControlName="confirmPassword"
                    placeholder="Confirm your password"
                    [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched">
                  <button 
                    type="button"
                    class="input-button"
                    (click)="hideConfirmPassword = !hideConfirmPassword">
                    <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </div>
                <div class="form-errors" *ngIf="(registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) || (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched)">
                  <div class="error-message" *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                    <mat-icon>error</mat-icon>
                    Please confirm your password
                  </div>
                  <div class="error-message" *ngIf="registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched">
                    <mat-icon>error</mat-icon>
                    Passwords do not match
                  </div>
                </div>
              </div>
              
              <!-- Contact Information -->
              <h3 class="section-title">Contact Information (Optional)</h3>
              
              <div class="form-field">
                <label for="phone" class="form-label">
                  <mat-icon>phone</mat-icon>
                  Phone Number
                </label>
                <input 
                  id="phone"
                  type="tel"
                  class="form-input"
                  formControlName="phone" 
                  placeholder="Enter your phone number">
              </div>
              
              <div class="form-field">
                <label for="address" class="form-label">
                  <mat-icon>home</mat-icon>
                  Address
                </label>
                <textarea 
                  id="address"
                  class="form-input form-textarea"
                  formControlName="address" 
                  placeholder="Enter your address"
                  rows="3">
                </textarea>
              </div>
              
              <!-- Action Buttons -->
              <div class="register-actions">
                <button 
                  type="submit"
                  class="btn-primary register-button"
                  [disabled]="registerForm.invalid || loading">
                  <mat-spinner *ngIf="loading" diameter="20" class="button-spinner"></mat-spinner>
                  <mat-icon *ngIf="!loading">person_add</mat-icon>
                  <span *ngIf="!loading">Create Account</span>
                  <span *ngIf="loading">Creating Account...</span>
                </button>
                
                <button 
                  type="button" 
                  (click)="goToLogin()"
                  class="btn-secondary login-link">
                  <mat-icon>login</mat-icon>
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      phone: [''],
      address: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Any initialization logic
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.loading) return;

    this.loading = true;
    const formValue = this.registerForm.value;
    
    // Remove confirmPassword from the data sent to backend
    const registrationData = {
      fullName: formValue.fullName,
      username: formValue.username,
      gender: formValue.gender,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone || undefined,
      address: formValue.address || undefined
    };

    this.http.post<any>(`${this.apiUrl}/auth/register`, registrationData).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(
          'Registration successful! Please wait for admin approval before logging in.', 
          'Close', 
          {
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        // Redirect to login after successful registration
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Registration failed. Please try again.';
        this.snackBar.open(message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}