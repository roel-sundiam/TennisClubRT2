import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsStats } from '../../../../../shared/types';

interface ActivityHistoryItem {
  _id: string;
  userId: {
    fullName: string;
    username: string;
  };
  action: string;
  component: string;
  details?: any;
  timestamp: Date;
  ipAddress: string;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="admin-analytics-container">
      <div class="admin-header">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>
          <mat-icon>analytics</mat-icon>
          Site Analytics Dashboard
        </h1>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="openMarketingPage()" class="marketing-button">
            <mat-icon>campaign</mat-icon>
            Marketing Page
          </button>
          <button mat-raised-button color="primary" (click)="refreshData()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Date Range Selector -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="date-filters">
            <mat-form-field appearance="outline">
              <mat-label>Time Period</mat-label>
              <mat-select [(value)]="selectedPeriod" (selectionChange)="onPeriodChange()">
                <mat-option value="1d">Last 24 Hours</mat-option>
                <mat-option value="7d">Last 7 Days</mat-option>
                <mat-option value="30d">Last 30 Days</mat-option>
                <mat-option value="90d">Last 90 Days</mat-option>
                <mat-option value="custom">Custom Range</mat-option>
              </mat-select>
            </mat-form-field>

            <div *ngIf="selectedPeriod === 'custom'" class="custom-date-range">
              <mat-form-field appearance="outline">
                <mat-label>From Date</mat-label>
                <input matInput [matDatepicker]="fromDatePicker" [(ngModel)]="customDateFrom">
                <mat-datepicker-toggle matSuffix [for]="fromDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #fromDatePicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>To Date</mat-label>
                <input matInput [matDatepicker]="toDatePicker" [(ngModel)]="customDateTo">
                <mat-datepicker-toggle matSuffix [for]="toDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #toDatePicker></mat-datepicker>
              </mat-form-field>

              <button mat-raised-button color="primary" (click)="applyCustomRange()">
                Apply Range
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading analytics data...</p>
      </div>

      <!-- Analytics Dashboard -->
      <div *ngIf="!loading && analyticsData" class="analytics-dashboard">
        
        <!-- Overview Cards -->
        <div class="overview-stats">
          <mat-card class="stat-card page-views">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>visibility</mat-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ analyticsData.pageViews.totalViews | number }}</h3>
                  <p>Total Page Views</p>
                  <small>{{ analyticsData.pageViews.uniqueUsers }} unique users</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card sessions">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>schedule</mat-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ analyticsData.engagement.totalSessions | number }}</h3>
                  <p>Total Sessions</p>
                  <small>{{ formatDuration(analyticsData.engagement.avgDuration) }} avg duration</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card bounce-rate">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>bounce</mat-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ analyticsData.engagement.bounceRate }}%</h3>
                  <p>Bounce Rate</p>
                  <small>{{ analyticsData.engagement.avgPageViews }} pages per session</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card avg-time">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>timer</mat-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ formatDuration(analyticsData.pageViews.avgDuration) }}</h3>
                  <p>Avg Time on Page</p>
                  <small>{{ analyticsData.engagement.avgActions }} actions per session</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-tab-group [(selectedIndex)]="selectedTab">
          
          <!-- Popular Pages Tab -->
          <mat-tab label="Popular Pages">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Most Visited Pages</mat-card-title>
                  <mat-card-subtitle>Ranking by total page views</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="popular-pages-list">
                    <div *ngFor="let page of analyticsData.popularPages; let i = index" 
                         class="page-item">
                      <div class="page-rank">{{ i + 1 }}</div>
                      <div class="page-info">
                        <h4>{{ page.page }}</h4>
                        <div class="page-stats">
                          <span class="views">{{ page.views }} views</span>
                          <span class="users">{{ page.uniqueUsers }} unique users</span>
                          <span class="duration">{{ formatDuration(page.avgDuration) }} avg time</span>
                        </div>
                        <small class="last-visit">Last visit: {{ formatDate(page.lastVisit) }}</small>
                      </div>
                      <div class="page-chart">
                        <div class="bar" [style.width.%]="getPageViewPercentage(page.views)"></div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- User Activity Tab -->
          <mat-tab label="User Activity">
            <div class="tab-content">
              <div class="activity-overview">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Activity Breakdown</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="activity-grid">
                      <div *ngFor="let activity of analyticsData.userActivity" class="activity-item">
                        <div class="activity-icon">
                          <mat-icon>{{ getActivityIcon(activity.action) }}</mat-icon>
                        </div>
                        <div class="activity-info">
                          <h4>{{ getActivityLabel(activity.action) }}</h4>
                          <div class="activity-stats">
                            <span class="count">{{ activity.count }} times</span>
                            <span class="users">{{ activity.uniqueUsers }} users</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Activity History -->
                <mat-card class="activity-history">
                  <mat-card-header>
                    <mat-card-title>Recent Activity History</mat-card-title>
                    <div class="activity-filters">
                      <mat-form-field appearance="outline">
                        <mat-label>Action</mat-label>
                        <mat-select [(value)]="activityFilters.action" (selectionChange)="loadActivityHistory()">
                          <mat-option value="">All Actions</mat-option>
                          <mat-option value="login">Login</mat-option>
                          <mat-option value="logout">Logout</mat-option>
                          <mat-option value="book_court">Book Court</mat-option>
                          <mat-option value="make_payment">Make Payment</mat-option>
                          <mat-option value="view_schedule">View Schedule</mat-option>
                          <mat-option value="submit_suggestion">Submit Suggestion</mat-option>
                          <mat-option value="vote_poll">Vote Poll</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Component</mat-label>
                        <mat-select [(value)]="activityFilters.component" (selectionChange)="loadActivityHistory()">
                          <mat-option value="">All Components</mat-option>
                          <mat-option value="auth">Authentication</mat-option>
                          <mat-option value="reservations">Reservations</mat-option>
                          <mat-option value="payments">Payments</mat-option>
                          <mat-option value="polls">Polls</mat-option>
                          <mat-option value="suggestions">Suggestions</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                  </mat-card-header>
                  <mat-card-content>
                    <div *ngIf="loadingActivity" class="loading-activity">
                      <mat-spinner diameter="30"></mat-spinner>
                      Loading activity history...
                    </div>
                    
                    <div *ngIf="!loadingActivity" class="activity-table">
                      <table mat-table [dataSource]="activityDataSource" class="activity-history-table">
                        <ng-container matColumnDef="timestamp">
                          <th mat-header-cell *matHeaderCellDef>Time</th>
                          <td mat-cell *matCellDef="let activity">{{ formatDateTime(activity.timestamp) }}</td>
                        </ng-container>

                        <ng-container matColumnDef="user">
                          <th mat-header-cell *matHeaderCellDef>User</th>
                          <td mat-cell *matCellDef="let activity">
                            {{ activity.userId.fullName }}
                            <small>({{ activity.userId.username }})</small>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="action">
                          <th mat-header-cell *matHeaderCellDef>Action</th>
                          <td mat-cell *matCellDef="let activity">
                            <mat-chip class="action-chip" [class]="activity.action">
                              {{ getActivityLabel(activity.action) }}
                            </mat-chip>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="component">
                          <th mat-header-cell *matHeaderCellDef>Component</th>
                          <td mat-cell *matCellDef="let activity">{{ activity.component }}</td>
                        </ng-container>

                        <ng-container matColumnDef="details">
                          <th mat-header-cell *matHeaderCellDef>Details</th>
                          <td mat-cell *matCellDef="let activity">
                            <span *ngIf="activity.details" [matTooltip]="getDetailsTooltip(activity.details)">
                              {{ getDetailsDisplay(activity.details) }}
                            </span>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="activityColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: activityColumns;"></tr>
                      </table>

                      <mat-paginator 
                        [length]="activityPagination.totalCount"
                        [pageSize]="activityPagination.pageSize"
                        [pageSizeOptions]="[10, 25, 50, 100]"
                        [pageIndex]="activityPagination.currentPage - 1"
                        (page)="onActivityPageChange($event)"
                        showFirstLastButtons>
                      </mat-paginator>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Device & Browser Analytics -->
          <mat-tab label="Device & Browser">
            <div class="tab-content">
              <div class="device-analytics">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Device Breakdown</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="breakdown-grid">
                      <div *ngFor="let device of getDeviceStats()" class="breakdown-item">
                        <div class="breakdown-info">
                          <h4>{{ device.name }}</h4>
                          <div class="breakdown-stats">
                            <span class="count">{{ device.count }} views</span>
                            <span class="percentage">{{ device.percentage }}%</span>
                          </div>
                        </div>
                        <div class="breakdown-bar">
                          <div class="bar" [style.width.%]="device.percentage"></div>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Browser Breakdown</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="breakdown-grid">
                      <div *ngFor="let browser of getBrowserStats()" class="breakdown-item">
                        <div class="breakdown-info">
                          <h4>{{ browser.name }}</h4>
                          <div class="breakdown-stats">
                            <span class="count">{{ browser.count }} views</span>
                            <span class="percentage">{{ browser.percentage }}%</span>
                          </div>
                        </div>
                        <div class="breakdown-bar">
                          <div class="bar" [style.width.%]="browser.percentage"></div>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styleUrl: './admin-analytics.component.scss'
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  
  loading = false;
  loadingActivity = false;
  selectedTab = 0;
  
  analyticsData: AnalyticsStats | null = null;
  selectedPeriod = '7d';
  customDateFrom: Date | null = null;
  customDateTo: Date | null = null;
  
  // Activity history
  activityHistory: ActivityHistoryItem[] = [];
  activityDataSource = new MatTableDataSource<ActivityHistoryItem>();
  activityColumns = ['timestamp', 'user', 'action', 'component', 'details'];
  activityFilters = {
    action: '',
    component: ''
  };
  activityPagination = {
    currentPage: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0
  };

  constructor(
    private router: Router,
    public authService: AuthService,
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check admin access
    if (!this.authService.currentUser || !['admin', 'superadmin'].includes(this.authService.currentUser.role)) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAnalyticsData();
    this.loadActivityHistory();
    
    // Auto-refresh every 5 minutes
    this.subscription.add(
      interval(300000).subscribe(() => {
        this.refreshData();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onPeriodChange(): void {
    if (this.selectedPeriod !== 'custom') {
      this.loadAnalyticsData();
    }
  }

  applyCustomRange(): void {
    if (this.customDateFrom && this.customDateTo) {
      this.loadAnalyticsData();
    }
  }

  loadAnalyticsData(): void {
    this.loading = true;
    
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    let period: string | undefined;
    
    if (this.selectedPeriod === 'custom') {
      dateFrom = this.customDateFrom || undefined;
      dateTo = this.customDateTo || undefined;
    } else {
      period = this.selectedPeriod;
    }

    this.subscription.add(
      this.analyticsService.getAnalyticsDashboard(dateFrom, dateTo, period).subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading analytics data:', error);
          
          if (error.status === 401) {
            this.showMessage('Authentication required. Please refresh the page and try again.', 'error');
          } else if (error.status === 403) {
            this.showMessage('Access denied. Admin privileges required.', 'error');
          } else {
            this.showMessage('Failed to load analytics data', 'error');
          }
          
          this.loading = false;
        }
      })
    );
  }

  loadActivityHistory(): void {
    this.loadingActivity = true;
    
    const filters = {
      page: this.activityPagination.currentPage,
      limit: this.activityPagination.pageSize,
      action: this.activityFilters.action || undefined,
      component: this.activityFilters.component || undefined,
      dateFrom: this.selectedPeriod === 'custom' ? this.customDateFrom || undefined : undefined,
      dateTo: this.selectedPeriod === 'custom' ? this.customDateTo || undefined : undefined
    };

    this.subscription.add(
      this.analyticsService.getActivityHistory(filters).subscribe({
        next: (response) => {
          this.activityHistory = response.data;
          this.activityDataSource.data = this.activityHistory;
          this.activityPagination = {
            currentPage: response.pagination.currentPage,
            pageSize: this.activityPagination.pageSize,
            totalCount: response.pagination.totalCount,
            totalPages: response.pagination.totalPages
          };
          this.loadingActivity = false;
        },
        error: (error) => {
          console.error('Error loading activity history:', error);
          
          if (error.status === 401) {
            this.showMessage('Authentication required. Please refresh the page and try again.', 'error');
          } else if (error.status === 403) {
            this.showMessage('Access denied. Admin privileges required.', 'error');
          } else {
            this.showMessage('Failed to load activity history', 'error');
          }
          
          this.loadingActivity = false;
        }
      })
    );
  }

  onActivityPageChange(event: PageEvent): void {
    this.activityPagination.currentPage = event.pageIndex + 1;
    this.activityPagination.pageSize = event.pageSize;
    this.loadActivityHistory();
  }

  refreshData(): void {
    this.loadAnalyticsData();
    this.loadActivityHistory();
    this.showMessage('Analytics data refreshed', 'success');
  }

  // Utility methods
  formatDuration(milliseconds: number): string {
    if (!milliseconds) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getPageViewPercentage(views: number): number {
    if (!this.analyticsData?.popularPages.length) return 0;
    const maxViews = Math.max(...this.analyticsData.popularPages.map(p => p.views));
    return (views / maxViews) * 100;
  }

  getActivityIcon(action: string): string {
    const iconMap: Record<string, string> = {
      login: 'login',
      logout: 'logout',
      book_court: 'event',
      cancel_reservation: 'event_busy',
      make_payment: 'payment',
      view_schedule: 'calendar_view_day',
      update_profile: 'person',
      submit_suggestion: 'feedback',
      vote_poll: 'how_to_vote',
      request_coins: 'monetization_on',
      search: 'search',
      filter: 'filter_list',
      download: 'download',
      export: 'file_download',
      click_button: 'mouse',
      form_submit: 'send',
      navigation: 'navigation'
    };
    return iconMap[action] || 'help';
  }

  getActivityLabel(action: string): string {
    const labelMap: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      book_court: 'Book Court',
      cancel_reservation: 'Cancel Reservation',
      make_payment: 'Make Payment',
      view_schedule: 'View Schedule',
      update_profile: 'Update Profile',
      submit_suggestion: 'Submit Suggestion',
      vote_poll: 'Vote in Poll',
      request_coins: 'Request Coins',
      search: 'Search',
      filter: 'Apply Filter',
      download: 'Download',
      export: 'Export',
      click_button: 'Button Click',
      form_submit: 'Form Submit',
      navigation: 'Navigate'
    };
    return labelMap[action] || action;
  }

  getDetailsDisplay(details: any): string {
    if (!details) return '';
    
    if (typeof details === 'string') return details;
    
    if (details.query) return `"${details.query}"`;
    if (details.button) return details.button;
    if (details.username) return details.username;
    if (details.fileName) return details.fileName;
    if (details.filterType) return `${details.filterType}: ${details.filterValue}`;
    if (details.from && details.to) return `${details.from} → ${details.to}`;
    
    return JSON.stringify(details).substring(0, 50) + (JSON.stringify(details).length > 50 ? '...' : '');
  }

  getDetailsTooltip(details: any): string {
    return JSON.stringify(details, null, 2);
  }

  getDeviceStats(): Array<{name: string; count: number; percentage: number}> {
    if (!this.analyticsData?.deviceBreakdown) return [];
    
    const total = Object.values(this.analyticsData.deviceBreakdown).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(this.analyticsData.deviceBreakdown)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  getBrowserStats(): Array<{name: string; count: number; percentage: number}> {
    if (!this.analyticsData?.browserBreakdown) return [];
    
    const total = Object.values(this.analyticsData.browserBreakdown).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(this.analyticsData.browserBreakdown)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  openMarketingPage(): void {
    // Open marketing page in a new tab
    // Update this URL to your actual marketing page URL when deployed
    const marketingUrl = window.location.origin + '/marketing/simple.html';
    window.open(marketingUrl, '_blank');
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    const config = {
      duration: 4000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center' as const,
      verticalPosition: 'bottom' as const
    };

    this.snackBar.open(message, 'Close', config);
  }
}