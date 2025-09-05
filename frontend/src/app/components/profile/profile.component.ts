import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService, User, UpdateProfileRequest, ChangePasswordRequest } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTabsModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <mat-icon class="avatar-icon">account_circle</mat-icon>
        </div>
        <div class="profile-info">
          <h1 class="profile-name">{{currentUser?.fullName}}</h1>
          <p class="profile-username">@{{currentUser?.username}}</p>
          <p class="profile-role">{{currentUser?.role | titlecase}}</p>
        </div>
      </div>

      <mat-tab-group class="profile-tabs" animationDuration="300ms">
        <!-- Profile Information Tab -->
        <mat-tab label="Profile Information">
          <div class="tab-content">
            <mat-card class="profile-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>person</mat-icon>
                  Personal Information
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="profile-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Full Name</mat-label>
                      <input matInput formControlName="fullName" placeholder="Enter your full name">
                      <mat-error *ngIf="profileForm.get('fullName')?.hasError('required')">
                        Full name is required
                      </mat-error>
                      <mat-error *ngIf="profileForm.get('fullName')?.hasError('minlength')">
                        Full name must be at least 2 characters
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email Address</mat-label>
                      <input matInput type="email" formControlName="email" placeholder="Enter your email">
                      <mat-error *ngIf="profileForm.get('email')?.hasError('required')">
                        Email is required
                      </mat-error>
                      <mat-error *ngIf="profileForm.get('email')?.hasError('email')">
                        Please enter a valid email address
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Phone Number</mat-label>
                      <input matInput formControlName="phone" placeholder="Enter your phone number">
                      <mat-error *ngIf="profileForm.get('phone')?.hasError('pattern')">
                        Please enter a valid phone number
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Date of Birth</mat-label>
                      <input matInput type="date" formControlName="dateOfBirth">
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" 
                            [disabled]="profileForm.invalid || isUpdatingProfile" class="update-btn">
                      <mat-icon>save</mat-icon>
                      {{isUpdatingProfile ? 'Updating...' : 'Update Profile'}}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Change Password Tab -->
        <mat-tab label="Change Password">
          <div class="tab-content">
            <mat-card class="profile-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>lock</mat-icon>
                  Change Password
                </mat-card-title>
                <mat-card-subtitle>
                  Update your account password for better security
                </mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="profile-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Current Password</mat-label>
                      <input matInput 
                             [type]="hideCurrentPassword ? 'password' : 'text'"
                             formControlName="currentPassword" 
                             placeholder="Enter current password">
                      <button mat-icon-button matSuffix 
                              (click)="hideCurrentPassword = !hideCurrentPassword"
                              type="button" 
                              [attr.aria-label]="'Hide password'"
                              [attr.aria-pressed]="hideCurrentPassword">
                        <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                        Current password is required
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>New Password</mat-label>
                      <input matInput 
                             [type]="hideNewPassword ? 'password' : 'text'"
                             formControlName="newPassword" 
                             placeholder="Enter new password">
                      <button mat-icon-button matSuffix 
                              (click)="hideNewPassword = !hideNewPassword"
                              type="button" 
                              [attr.aria-label]="'Hide password'"
                              [attr.aria-pressed]="hideNewPassword">
                        <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                        New password is required
                      </mat-error>
                      <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                        Password must be at least 6 characters
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Confirm New Password</mat-label>
                      <input matInput 
                             [type]="hideConfirmPassword ? 'password' : 'text'"
                             formControlName="confirmPassword" 
                             placeholder="Confirm new password">
                      <button mat-icon-button matSuffix 
                              (click)="hideConfirmPassword = !hideConfirmPassword"
                              type="button" 
                              [attr.aria-label]="'Hide password'"
                              [attr.aria-pressed]="hideConfirmPassword">
                        <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
                        Please confirm your new password
                      </mat-error>
                      <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('mismatch')">
                        Passwords do not match
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="accent" type="submit" 
                            [disabled]="passwordForm.invalid || isChangingPassword" class="update-btn">
                      <mat-icon>security</mat-icon>
                      {{isChangingPassword ? 'Changing...' : 'Change Password'}}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isUpdatingProfile = false;
  isChangingPassword = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadProfile();
  }

  private initializeForms(): void {
    this.profileForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[\+]?[\d\s\-\(\)]+$/)]],
      dateOfBirth: ['']
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  private loadProfile(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        fullName: this.currentUser.fullName,
        email: this.currentUser.email,
        phone: this.currentUser.phone || '',
        dateOfBirth: this.currentUser.dateOfBirth ? 
          new Date(this.currentUser.dateOfBirth).toISOString().split('T')[0] : ''
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.isUpdatingProfile = true;
      const profileData: UpdateProfileRequest = this.profileForm.value;
      
      this.authService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.isUpdatingProfile = false;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.isUpdatingProfile = false;
          const errorMessage = error.error?.message || 'Failed to update profile';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isChangingPassword = true;
      const passwordData: ChangePasswordRequest = this.passwordForm.value;
      
      this.authService.changePassword(passwordData).subscribe({
        next: (response) => {
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.snackBar.open('Password changed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.isChangingPassword = false;
          const errorMessage = error.error?.message || 'Failed to change password';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}