import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
// Removed ToastModule and MessageService - using custom error message

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    ProgressSpinnerModule
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  template: `
    <div class="login-container">
      <!-- Left Panel - How It Works -->
      <div class="info-panel">
        <div class="info-header">
          <div class="logo-section">
            <div class="logo-icon">
              <i class="pi pi-bolt"></i>
            </div>
            <div>
              <h1 class="app-title">Rich Town 2 Tennis Club</h1>
              <p class="app-tagline">Modern Court Reservation System</p>
            </div>
          </div>
        </div>
        
        <div class="features-section">
          <h2 class="features-title">How It Works</h2>
          <div class="features-subtitle">
            <p>Join our competitive tennis community with rankings, open court play, and professional court management</p>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-calendar-plus"></i>
            </div>
            <div class="feature-content">
              <h3>Reserve Courts</h3>
              <p>Book tennis courts with flexible scheduling. Choose from available time slots between 5 AM - 10 PM.</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-trophy"></i>
            </div>
            <div class="feature-content">
              <h3>Open Court & Rankings</h3>
              <p>Participate in open court sessions, earn points from competitive matches, and climb the seeding rankings. Build your tennis reputation!</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-coins"></i>
            </div>
            <div class="feature-content">
              <h3>Coin System</h3>
              <p>Earn and spend coins for app features. New members receive 100 free coins to get started!</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="feature-content">
              <h3>Member Community</h3>
              <p>Join our approved tennis club community. Connect with players and improve your ranking together.</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-credit-card"></i>
            </div>
            <div class="feature-content">
              <h3>Easy Payments</h3>
              <p>Handle membership fees and court bookings seamlessly. Peak hours ₱100, off-peak ₱20 per player.</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-cloud"></i>
            </div>
            <div class="feature-content">
              <h3>Weather Integration</h3>
              <p>Get real-time weather updates for Delapaz Norte, San Fernando, Pampanga before your game.</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Panel - Login Form -->
      <div class="login-panel">
        <p-card class="login-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <div class="header-icon">
                <i class="pi pi-sign-in"></i>
              </div>
              <div class="header-text">
                <h2 class="login-title">Welcome Back</h2>
                <p class="login-subtitle">Please sign in to your account</p>
              </div>
            </div>
          </ng-template>
          
          <div class="card-content">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>
              
              <!-- Username Field -->
              <div class="field">
                <label for="username" class="field-label">Username</label>
                <div class="p-input-icon-right">
                  <i class="pi pi-user"></i>
                  <input 
                    pInputText 
                    id="username"
                    formControlName="username" 
                    placeholder="Enter your username"
                    class="full-width"
                    autocomplete="username"
                    aria-required="false"
                    required="false"
                    [class.p-invalid]="false">
                </div>
              </div>
              
              <!-- Password Field -->
              <div class="field">
                <label for="password" class="field-label">Password</label>
                <p-password
                  formControlName="password"
                  placeholder="Enter your password"
                  styleClass="full-width"
                  inputStyleClass="full-width"
                  [toggleMask]="true"
                  [feedback]="false"
                  autocomplete="current-password"
                  (keydown.enter)="onSubmit()"
                  [class.p-invalid]="false">
                </p-password>
              </div>

              <!-- Modern Error Message -->
              <div *ngIf="loginError" class="error-container" [@slideIn]>
                <div class="modern-error-alert">
                  <div class="error-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>
                  <div class="error-content">
                    <div class="error-title">Login Failed</div>
                    <div class="error-message">{{ loginError }}</div>
                  </div>
                  <button 
                    type="button"
                    class="error-close" 
                    (click)="clearError()"
                    aria-label="Close error message">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>
              
              <!-- Login Actions -->
              <div class="login-actions">
                <p-button 
                  type="button"
                  label="Sign In"
                  icon="pi pi-sign-in"
                  class="login-button"
                  styleClass="w-full p-button-raised"
                  (onClick)="onSubmit($event)"
                  [disabled]="loading"
                  [loading]="loading"
                  loadingIcon="pi pi-spinner pi-spin">
                </p-button>
                
              </div>
            </form>
          </div>
          
          <ng-template pTemplate="footer">
            <div class="login-help">
              <div class="help-text">
                <i class="pi pi-info-circle"></i>
                <span>New to Rich Town 2 Tennis Club?</span>
                <p-button 
                  label="Create your account here"
                  link="true"
                  styleClass="register-link"
                  (onClick)="goToRegister()">
                </p-button>
              </div>
            </div>
          </ng-template>
        </p-card>
      </div>
      
      <!-- Custom error messages handled inline -->
    </div>
  `,
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  loginError: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private analyticsService: AnalyticsService
  ) {
    console.log('LoginComponent constructor called');
    this.loginForm = this.fb.group({
      username: [''],
      password: ['']
    });
  }


  goToRegister(): void {
    // Track navigation to register page
    this.analyticsService.trackButtonClick('Create Account', 'login', { destination: 'register' });
    this.router.navigate(['/register']);
  }

  clearError(): void {
    this.loginError = '';
  }


  ngOnInit(): void {
    console.log('LoginComponent ngOnInit called');
    console.log('Auth service authenticated:', this.authService.isAuthenticated());
    
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      console.log('Already authenticated, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    }
    
  }

  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('onSubmit called');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form value:', this.loginForm.value);
    console.log('Loading:', this.loading);
    
    // Clear any previous errors
    this.loginError = '';
    
    // Custom validation
    const username = this.loginForm.get('username')?.value?.trim();
    const password = this.loginForm.get('password')?.value?.trim();
    
    if (!username || !password) {
      this.loginError = 'Please enter both username and password.';
      return;
    }
    
    if (!this.loading) {
      this.loading = true;
      console.log('Making login request...');
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          console.log('Login successful, response:', response);
          this.loading = false;
          
          // Track successful login
          const username = this.loginForm.value.username;
          this.analyticsService.trackLogin(username);
          
          // Success - no toast needed, just navigate
          console.log('Navigating to dashboard...');
          this.router.navigate(['/dashboard']);
        },
        error: (error: any) => {
          console.log('Login error:', error);
          this.loading = false;
          
          // Set custom error message for modern error display (no more toast)
          if (error.status === 401) {
            this.loginError = 'Invalid username or password. Please check your credentials and try again.';
          } else if (error.status === 403) {
            this.loginError = 'Your account is pending approval or missing membership fees payment.';
          } else {
            this.loginError = error.error?.error || 'Login failed. Please try again later.';
          }
          
          // Don't show toast for login errors anymore - we use the modern inline error
        }
      });
    } else {
      console.log('Form validation failed or already loading');
      if (!this.loginForm.valid) {
        console.log('Form errors:', this.loginForm.errors);
        console.log('Username errors:', this.loginForm.get('username')?.errors);
        console.log('Password errors:', this.loginForm.get('password')?.errors);
      }
    }
  }
}