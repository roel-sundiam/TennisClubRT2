import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import { MemberService, Member, MemberActivity, MemberProfileResponse } from '../../services/member.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-content">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="title-section">
              <button mat-icon-button (click)="goBack()" class="back-button">
                <mat-icon>arrow_back</mat-icon>
              </button>
              <div class="title-info">
                <h1 class="page-title">
                  <mat-icon>person</mat-icon>
                  Member Profile
                </h1>
                <p class="page-subtitle" *ngIf="member">
                  Viewing {{member.fullName}}'s profile
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Spinner -->
        <div class="loading-card" *ngIf="loading">
          <mat-spinner></mat-spinner>
          <p>Loading member profile...</p>
        </div>

        <!-- Error Message -->
        <div class="error-card" *ngIf="error && !loading">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Unable to load profile</h3>
          <p>{{error}}</p>
          <button mat-raised-button color="primary" (click)="loadMemberData()" class="retry-btn">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>

        <!-- Member Profile Content -->
        <div class="profile-content" *ngIf="!loading && !error && member">
          
          <!-- Profile Header Card -->
          <div class="profile-header-card">
            <div class="profile-header-content">
              <div class="avatar-section">
                <div class="member-avatar">
                  <mat-icon *ngIf="!member.profilePicture">person</mat-icon>
                  <img *ngIf="member.profilePicture" [src]="member.profilePicture" [alt]="member.fullName">
                </div>
                
                <!-- Status Indicators -->
                <div class="status-indicators" *ngIf="isAdmin">
                  <span class="status-badge approved" *ngIf="member.isApproved">
                    <mat-icon>verified</mat-icon>
                    Approved
                  </span>
                  <span class="status-badge pending" *ngIf="!member.isApproved">
                    <mat-icon>pending</mat-icon>
                    Pending Approval
                  </span>
                  <span class="status-badge inactive" *ngIf="!member.isActive">
                    <mat-icon>block</mat-icon>
                    Inactive
                  </span>
                </div>
              </div>

              <div class="profile-info">
                <div class="name-section">
                  <h2 class="member-name">{{member.fullName}}</h2>
                  <div class="role-badge" [class]="'role-' + member.role">
                    <mat-icon>{{getRoleIcon(member.role)}}</mat-icon>
                    {{member.role | titlecase}}
                  </div>
                </div>

                <div class="username-section">
                  <mat-icon class="username-icon">alternate_email</mat-icon>
                  <span class="username">{{member.username}}</span>
                </div>

                <div class="member-since">
                  <mat-icon>event</mat-icon>
                  Member since {{member.registrationDate | date:'MMMM yyyy'}}
                </div>

                <div class="last-active" *ngIf="member.lastLogin">
                  <mat-icon>access_time</mat-icon>
                  Last active {{member.lastLogin | date:'short'}}
                </div>
              </div>
            </div>

            <!-- Contact Actions -->
            <div class="contact-actions" *ngIf="!isOwnProfile">
              <button mat-raised-button color="primary" (click)="contactMember()" [disabled]="!canContact()" class="contact-btn">
                <mat-icon>message</mat-icon>
                Send Message
              </button>
            </div>
          </div>

          <!-- Tabbed Content -->
          <div class="profile-tabs-container">
            <mat-tab-group class="profile-tabs">
              
              <!-- Personal Information Tab -->
              <mat-tab label="Personal Info">
                <div class="tab-content">
                  <div class="info-card">
                    <div class="card-header">
                      <div class="header-icon">
                        <mat-icon>person_outline</mat-icon>
                      </div>
                      <h3 class="card-title">Personal Information</h3>
                    </div>
                    
                    <div class="card-content">
                      <div class="info-grid">
                        
                        <!-- Contact Information (admin or own profile) -->
                        <div class="info-section" *ngIf="canViewContactInfo()">
                          <h4>Contact Information</h4>
                          <div class="info-item">
                            <mat-icon>email</mat-icon>
                            <span class="label">Email:</span>
                            <span class="value">{{member.email}}</span>
                          </div>
                          
                          <div class="info-item" *ngIf="member.phone">
                            <mat-icon>phone</mat-icon>
                            <span class="label">Phone:</span>
                            <span class="value">{{member.phone}}</span>
                          </div>
                        </div>

                        <!-- Basic Information -->
                        <div class="info-section">
                          <h4>Basic Information</h4>
                          
                          <div class="info-item" *ngIf="member.gender">
                            <mat-icon>person</mat-icon>
                            <span class="label">Gender:</span>
                            <span class="value">{{member.gender | titlecase}}</span>
                          </div>
                          
                          <div class="info-item" *ngIf="member.dateOfBirth">
                            <mat-icon>cake</mat-icon>
                            <span class="label">Date of Birth:</span>
                            <span class="value">{{member.dateOfBirth | date:'mediumDate'}}</span>
                          </div>
                        </div>

                        <!-- Membership Information (admin only) -->
                        <div class="info-section" *ngIf="isAdmin">
                          <h4>Membership Status</h4>
                          
                          <div class="info-item">
                            <mat-icon>card_membership</mat-icon>
                            <span class="label">Membership Fees:</span>
                            <span class="value" [class.paid]="member.membershipFeesPaid" [class.unpaid]="!member.membershipFeesPaid">
                              {{member.membershipFeesPaid ? 'Paid' : 'Unpaid'}}
                            </span>
                          </div>
                          
                          <div class="info-item">
                            <mat-icon>account_balance_wallet</mat-icon>
                            <span class="label">Coin Balance:</span>
                            <span class="value coin-balance">{{member.coinBalance}} coins</span>
                          </div>

                          <div class="info-item">
                            <mat-icon>how_to_reg</mat-icon>
                            <span class="label">Registration Date:</span>
                            <span class="value">{{member.registrationDate | date:'full'}}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Activity Tab (if user can view activity) -->
              <mat-tab label="Activity" *ngIf="canViewActivity()">
                <div class="tab-content">
                  
                  <!-- Loading activity -->
                  <div class="activity-loading-card" *ngIf="activityLoading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Loading activity...</p>
                  </div>

                  <!-- Activity List -->
                  <div class="activity-card" *ngIf="!activityLoading">
                    <div class="card-header">
                      <div class="header-icon">
                        <mat-icon>history</mat-icon>
                      </div>
                      <div class="header-text">
                        <h3 class="card-title">Recent Activity</h3>
                        <p class="card-subtitle">Latest member activities and interactions</p>
                      </div>
                    </div>
                    
                    <div class="card-content">
                      <!-- No activity message -->
                      <div class="no-activity" *ngIf="activities.length === 0">
                        <mat-icon>event_busy</mat-icon>
                        <p>No recent activity to display</p>
                      </div>

                      <!-- Activity List -->
                      <div class="activity-list" *ngIf="activities.length > 0">
                        <div class="activity-item" *ngFor="let activity of activities; let last = last">
                          <div class="activity-icon" [class]="'activity-' + activity.type">
                            <mat-icon>{{getActivityIcon(activity.type)}}</mat-icon>
                          </div>
                          <div class="activity-content">
                            <div class="activity-description">{{activity.description}}</div>
                            <div class="activity-meta">
                              <span class="activity-date">{{activity.date | date:'short'}}</span>
                              <span class="activity-amount" *ngIf="activity.amount">
                                Amount: ₱{{activity.amount}}
                              </span>
                            </div>
                          </div>
                          <div class="activity-divider" *ngIf="!last"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

            </mat-tab-group>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './member-profile.component.scss'
})
export class MemberProfileComponent implements OnInit, OnDestroy {
  member: Member | null = null;
  activities: MemberActivity[] = [];
  loading = false;
  activityLoading = false;
  error = '';
  isAdmin = false;
  isOwnProfile = false;
  memberId = '';

  private destroy$ = new Subject<void>();

  constructor(
    private memberService: MemberService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.memberId = params['id'];
      this.isOwnProfile = this.memberId === this.authService.currentUser?._id;
      this.loadMemberData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMemberData(): void {
    this.loading = true;
    this.error = '';

    // First load member profile
    this.memberService.getMemberProfile(this.memberId).subscribe({
      next: (response: MemberProfileResponse) => {
        console.log('Member profile response:', response);
        this.member = response.data;
        this.loading = false;
        
        // Then load activity if permitted
        if (this.canViewActivity()) {
          this.loadMemberActivity();
        }
      },
      error: (error) => {
        console.error('Error loading member profile:', error);
        this.error = error.error?.message || 'Failed to load member profile. Please try again.';
        this.loading = false;
      }
    });
  }

  private loadMemberActivity(): void {
    this.activityLoading = true;
    
    this.memberService.getMemberActivity(this.memberId).subscribe({
      next: (response: any) => {
        this.activities = response.data || response || [];
        this.activityLoading = false;
      },
      error: (error) => {
        console.error('Error loading member activity:', error);
        this.activities = [];
        this.activityLoading = false;
      }
    });
  }

  canViewContactInfo(): boolean {
    return this.isOwnProfile || this.isAdmin;
  }

  canViewActivity(): boolean {
    return this.isOwnProfile || this.isAdmin;
  }

  canContact(): boolean {
    return !this.isOwnProfile && 
           this.member?.isApproved && 
           this.member?.isActive;
  }

  contactMember(): void {
    if (this.member) {
      console.log('Contact member:', this.member.username);
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'superadmin':
        return 'admin_panel_settings';
      case 'admin':
        return 'admin_panel_settings';
      default:
        return 'person';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'reservation':
        return 'event';
      case 'payment':
        return 'payment';
      case 'coin_transaction':
        return 'monetization_on';
      default:
        return 'info';
    }
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }
}