import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService, OpenPlayNotification } from '../../services/notification.service';
import { PWANotificationService } from '../../services/pwa-notification.service';
import { CoinBalanceComponent } from '../../components/coin-balance/coin-balance.component';
import { AnalyticsService } from '../../services/analytics.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CoinBalanceComponent
  ],
  template: `
    <!-- Modern Header -->
    <mat-toolbar class="modern-header" [class.mobile-menu-open]="isMobileMenuOpen">
      <div class="header-wrapper">
        <!-- Logo Section -->
        <div class="logo-section" (click)="handleLogoClick()" role="button" tabindex="0" (keydown.enter)="handleLogoClick()" (keydown.space)="handleLogoClick()">
          <div class="logo-icon">
            <img src="images/rt2-logo.png" alt="Rich Town 2 Tennis Club" class="club-logo">
          </div>
          <div class="logo-text">
            <h1 class="club-name">Rich Town 2 Tennis Club</h1>
          </div>
        </div>
        
        <!-- Mobile Home Button -->
        <button mat-icon-button class="mobile-home-btn" (click)="navigateTo('/dashboard')" aria-label="Go to Dashboard">
          <mat-icon>home</mat-icon>
        </button>
        
        <!-- Desktop Navigation -->
        <nav class="desktop-nav">
          <div class="nav-group">
            <button mat-button class="nav-item primary-nav" (click)="navigateTo('/reservations')">
              <mat-icon>calendar_today</mat-icon>
              <span>Reserve Court</span>
            </button>
            <button mat-button class="nav-item" (click)="navigateTo('/my-reservations')">
              <mat-icon>event</mat-icon>
              <span>My Bookings</span>
            </button>
          </div>
          
          <div class="nav-separator"></div>
          
          <div class="nav-group">
            <button mat-button class="nav-item" (click)="navigateTo('/members')">
              <mat-icon>people</mat-icon>
              <span>Members</span>
            </button>
            <button mat-button class="nav-item" (click)="navigateTo('/polls')">
              <mat-icon>how_to_vote</mat-icon>
              <span>Open Play</span>
            </button>
            <button mat-button class="nav-item" (click)="navigateTo('/rankings')">
              <mat-icon>leaderboard</mat-icon>
              <span>Rankings</span>
            </button>
          </div>
          
          <div class="nav-separator"></div>
          
          <div class="nav-group user-section">
            <div class="user-info">
              <mat-icon class="user-icon">account_circle</mat-icon>
              <span class="username">{{currentUser?.fullName}}</span>
            </div>
            <button mat-button class="nav-item logout-btn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </mat-toolbar>
    
    <!-- Mobile Navigation Overlay -->
    <div class="mobile-nav-overlay" [class.open]="isMobileMenuOpen" (click)="closeMobileMenu()"></div>
    
    <!-- Mobile Navigation Menu -->
    <nav class="mobile-nav" [class.open]="isMobileMenuOpen">
      <div class="mobile-nav-content">
        <div class="mobile-user-info">
          <div class="mobile-avatar">
            <mat-icon>account_circle</mat-icon>
          </div>
          <div class="mobile-user-details">
            <span class="mobile-user-name">{{currentUser?.fullName}}</span>
            <div class="mobile-user-stats">
              <div class="mobile-stat-item">
                <mat-icon>stars</mat-icon>
                <span>{{getUserSeed() === 0 ? 'Unranked' : 'Seed #' + getUserSeed()}}</span>
              </div>
              <div class="mobile-stat-item">
                <mat-icon>emoji_events</mat-icon>
                <span>{{getUserPoints()}} points</span>
              </div>
              <div class="mobile-stat-item">
                <app-coin-balance [compact]="false"></app-coin-balance>
              </div>
            </div>
            <span class="mobile-user-role" *ngIf="isAdmin">Administrator</span>
            <span class="mobile-user-role" *ngIf="!isAdmin">Member</span>
          </div>
        </div>
        
        <div class="mobile-nav-items">
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/reservations')">
            <mat-icon>calendar_today</mat-icon>
            <span>Reserve Court</span>
          </button>
          
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/my-reservations')">
            <mat-icon>event</mat-icon>
            <span>My Bookings</span>
          </button>
          
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/members')">
            <mat-icon>people</mat-icon>
            <span>Members Directory</span>
          </button>
          
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/polls')">
            <mat-icon>how_to_vote</mat-icon>
            <span>Open Play</span>
          </button>
          
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/payments')">
            <mat-icon>payment</mat-icon>
            <span>Payments</span>
          </button>
          
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/coins')">
            <mat-icon>monetization_on</mat-icon>
            <span>Coin Management</span>
          </button>
          
          <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/rankings')">
            <mat-icon>leaderboard</mat-icon>
            <span>Rankings</span>
          </button>
          
          <!-- Admin Section -->
          <div class="mobile-nav-section" *ngIf="isAdmin">
            <div class="section-header">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Administration</span>
            </div>
            
            <button mat-button class="mobile-nav-item admin-item" (click)="navigateAndClose('/admin/members')">
              <mat-icon>people_alt</mat-icon>
              <span>Member Management</span>
            </button>
            
            <button mat-button class="mobile-nav-item admin-item" (click)="navigateAndClose('/admin/reports')">
              <mat-icon>analytics</mat-icon>
              <span>Reports & Analytics</span>
            </button>
            
            <button mat-button class="mobile-nav-item admin-item" (click)="navigateAndClose('/admin/polls')">
              <mat-icon>poll</mat-icon>
              <span>Poll Management</span>
            </button>
            
            <button mat-button class="mobile-nav-item admin-item" (click)="navigateAndClose('/admin/coins')">
              <mat-icon>monetization_on</mat-icon>
              <span>Coin Management</span>
            </button>

            <button mat-button class="mobile-nav-item admin-item" (click)="navigateAndClose('/admin/block-court')">
              <mat-icon>block</mat-icon>
              <span>Block Court</span>
            </button>

            <button mat-button class="mobile-nav-item admin-item" *ngIf="isSuperAdmin" (click)="navigateAndClose('/admin/manual-court-usage')">
              <mat-icon>edit_calendar</mat-icon>
              <span>Manual Court Usage</span>
            </button>
          </div>
          
          <!-- Profile & Logout -->
          <div class="mobile-nav-section">
            <button mat-button class="mobile-nav-item" (click)="navigateAndClose('/profile')">
              <mat-icon>person</mat-icon>
              <span>My Profile</span>
            </button>
            
            <button mat-button class="mobile-nav-item logout-item" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAdmin = false;
  isSuperAdmin = false;
  isMobileMenuOpen = false;
  
  private userSubscription: Subscription = new Subscription();
  private notificationSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private notificationService: NotificationService,
    private pwaNotificationService: PWANotificationService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      this.isSuperAdmin = user?.role === 'superadmin';
    });

    // Subscribe to open play notifications
    this.notificationSubscription = this.notificationService.notifications$.subscribe(notifications => {
      // Handle notifications if needed
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.notificationSubscription.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  navigateTo(path: string): void {
    // Track navigation button clicks
    const buttonName = this.getButtonNameForPath(path);
    this.analyticsService.trackButtonClick(buttonName, 'toolbar', { destination: path });
    this.router.navigate([path]);
  }

  navigateAndClose(path: string): void {
    // Track mobile navigation button clicks
    const buttonName = this.getButtonNameForPath(path);
    this.analyticsService.trackButtonClick(buttonName, 'mobile-toolbar', { destination: path });
    this.router.navigate([path]);
    this.closeMobileMenu();
  }

  handleLogoClick(): void {
    // Check if we're on mobile (using window width)
    if (window.innerWidth <= 1024) {
      // On mobile, toggle the mobile menu
      this.toggleMobileMenu();
    } else {
      // On desktop, navigate to dashboard
      this.router.navigate(['/dashboard']);
    }
  }

  viewProfile(): void {
    this.router.navigate(['/dashboard']); // Redirect to dashboard for now
  }

  getUserSeed(): number {
    // For now, return 0 as seed/ranking logic may be handled elsewhere
    return 0;
  }

  getUserPoints(): number {
    return this.currentUser?.seedPoints || 0;
  }

  logout(): void {
    // Track logout action
    this.analyticsService.trackLogout();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getButtonNameForPath(path: string): string {
    const pathMap: Record<string, string> = {
      '/reservations': 'Reserve Court',
      '/my-reservations': 'My Bookings',
      '/members': 'Members',
      '/polls': 'Open Play',
      '/rankings': 'Rankings',
      '/payments': 'Payments',
      '/coins': 'Coin Management',
      '/profile': 'My Profile',
      '/dashboard': 'Dashboard',
      '/admin/members': 'Member Management',
      '/admin/reports': 'Reports & Analytics',
      '/admin/polls': 'Poll Management',
      '/admin/coins': 'Admin Coin Management',
      '/admin/block-court': 'Block Court',
      '/admin/manual-court-usage': 'Manual Court Usage'
    };
    return pathMap[path] || `Navigate to ${path}`;
  }
}