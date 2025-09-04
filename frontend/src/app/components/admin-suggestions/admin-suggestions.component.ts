import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminResponseDialogComponent } from '../admin-response-dialog/admin-response-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';
import { environment } from '../../../environments/environment';

interface Suggestion {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    username: string;
  } | string;
  type: 'suggestion' | 'complaint';
  category: 'facility' | 'service' | 'booking' | 'payments' | 'general' | 'staff' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  status: 'open' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
  isAnonymous: boolean;
  adminResponse?: {
    responderId: {
      _id: string;
      fullName: string;
      username: string;
    } | string;
    response: string;
    responseDate: Date;
    actionTaken?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SuggestionStats {
  general: {
    totalSuggestions: number;
    openCount: number;
    inReviewCount: number;
    inProgressCount: number;
    resolvedCount: number;
    closedCount: number;
    suggestionCount: number;
    complaintCount: number;
    urgentCount: number;
    highPriorityCount: number;
  };
  categories: Array<{
    _id: string;
    count: number;
    openCount: number;
    resolvedCount: number;
  }>;
}

@Component({
  selector: 'app-admin-suggestions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="admin-suggestions-container">
      <div class="admin-header">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>
          <mat-icon>admin_panel_settings</mat-icon>
          Suggestions & Complaints Management
        </h1>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid" *ngIf="stats">
        <mat-card class="stat-card total">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>feedback</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.general.totalSuggestions || 0 }}</h3>
                <p>Total Feedback</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card urgent" 
                 [matBadge]="stats.general.urgentCount || 0" 
                 matBadgeColor="warn"
                 [matBadgeHidden]="!stats.general.urgentCount">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>priority_high</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.general.openCount || 0 }}</h3>
                <p>Open Items</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card complaints">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>report_problem</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.general.complaintCount || 0 }}</h3>
                <p>Complaints</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card suggestions">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>lightbulb</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.general.suggestionCount || 0 }}</h3>
                <p>Suggestions</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="main-card">
        <mat-tab-group [(selectedIndex)]="selectedTab">
          
          <!-- All Suggestions -->
          <mat-tab [label]="'All Feedback (' + (totalCount || 0) + ')'">
            <div class="tab-content">
              
              <!-- Filters -->
              <div class="filters-section">
                <div class="filters-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Type</mat-label>
                    <mat-select [(value)]="filters.type" (selectionChange)="applyFilters()">
                      <mat-option value="">All Types</mat-option>
                      <mat-option value="suggestion">Suggestions</mat-option>
                      <mat-option value="complaint">Complaints</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Status</mat-label>
                    <mat-select [(value)]="filters.status" (selectionChange)="applyFilters()">
                      <mat-option value="">All Statuses</mat-option>
                      <mat-option value="open">Open</mat-option>
                      <mat-option value="in_review">In Review</mat-option>
                      <mat-option value="in_progress">In Progress</mat-option>
                      <mat-option value="resolved">Resolved</mat-option>
                      <mat-option value="closed">Closed</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Category</mat-label>
                    <mat-select [(value)]="filters.category" (selectionChange)="applyFilters()">
                      <mat-option value="">All Categories</mat-option>
                      <mat-option value="facility">Facility</mat-option>
                      <mat-option value="service">Service</mat-option>
                      <mat-option value="booking">Booking</mat-option>
                      <mat-option value="payments">Payments</mat-option>
                      <mat-option value="staff">Staff</mat-option>
                      <mat-option value="maintenance">Maintenance</mat-option>
                      <mat-option value="general">General</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Priority</mat-label>
                    <mat-select [(value)]="filters.priority" (selectionChange)="applyFilters()">
                      <mat-option value="">All Priorities</mat-option>
                      <mat-option value="urgent">Urgent</mat-option>
                      <mat-option value="high">High</mat-option>
                      <mat-option value="medium">Medium</mat-option>
                      <mat-option value="low">Low</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Search</mat-label>
                    <input matInput [(ngModel)]="filters.search" 
                           (keyup.enter)="applyFilters()" 
                           placeholder="Search title or description">
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>

                  <button mat-raised-button color="primary" (click)="applyFilters()">
                    <mat-icon>search</mat-icon>
                    Search
                  </button>

                  <button mat-button (click)="clearFilters()">
                    <mat-icon>clear</mat-icon>
                    Clear
                  </button>
                </div>
              </div>

              <!-- Loading State -->
              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading suggestions...</p>
              </div>

              <!-- Suggestions List -->
              <div *ngIf="!loading" class="suggestions-list">
                <mat-card *ngFor="let suggestion of suggestions" class="suggestion-card"
                         [class]="getSuggestionClass(suggestion)">
                  <mat-card-header>
                    <div class="suggestion-header">
                      <div class="suggestion-info">
                        <div class="suggestion-title">
                          <mat-icon>{{ getSuggestionIcon(suggestion) }}</mat-icon>
                          <h3>{{ suggestion.title }}</h3>
                          <span *ngIf="suggestion.isAnonymous" class="anonymous-badge" matTooltip="Anonymous submission">
                            <mat-icon>visibility_off</mat-icon>
                          </span>
                        </div>
                        <div class="suggestion-meta">
                          <span class="type-badge" [class]="suggestion.type">
                            {{ suggestion.type | titlecase }}
                          </span>
                          <span class="category-badge">
                            {{ getCategoryLabel(suggestion.category) }}
                          </span>
                          <span class="priority-badge" [class]="suggestion.priority">
                            {{ suggestion.priority | titlecase }}
                          </span>
                          <span class="status-badge" [class]="suggestion.status">
                            {{ getStatusLabel(suggestion.status) }}
                          </span>
                        </div>
                        <div class="suggestion-submitter">
                          <mat-icon>person</mat-icon>
                          <span *ngIf="!suggestion.isAnonymous">{{ getUserFullName(suggestion) || 'Unknown User' }}</span>
                          <span *ngIf="suggestion.isAnonymous" class="anonymous-text">Anonymous User</span>
                          <span class="submission-date">• {{ formatDate(suggestion.createdAt) }}</span>
                        </div>
                      </div>
                      <div class="suggestion-actions">
                        <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #actionMenu="matMenu">
                          <button mat-menu-item (click)="changeStatus(suggestion, 'in_review')"
                                  [disabled]="suggestion.status === 'in_review'">
                            <mat-icon>rate_review</mat-icon>
                            Mark as In Review
                          </button>
                          <button mat-menu-item (click)="changeStatus(suggestion, 'in_progress')"
                                  [disabled]="suggestion.status === 'in_progress'">
                            <mat-icon>hourglass_empty</mat-icon>
                            Mark as In Progress
                          </button>
                          <button mat-menu-item (click)="changeStatus(suggestion, 'resolved')"
                                  [disabled]="suggestion.status === 'resolved'">
                            <mat-icon>check_circle</mat-icon>
                            Mark as Resolved
                          </button>
                          <button mat-menu-item (click)="changeStatus(suggestion, 'closed')"
                                  [disabled]="suggestion.status === 'closed'">
                            <mat-icon>close</mat-icon>
                            Close
                          </button>
                          <mat-divider></mat-divider>
                          <button mat-menu-item (click)="openResponseDialog(suggestion)">
                            <mat-icon>reply</mat-icon>
                            {{ suggestion.adminResponse ? 'Update Response' : 'Add Response' }}
                          </button>
                        </mat-menu>
                      </div>
                    </div>
                  </mat-card-header>

                  <mat-card-content>
                    <p class="suggestion-description">{{ suggestion.description }}</p>
                    
                    <!-- Admin Response -->
                    <div *ngIf="suggestion.adminResponse" class="admin-response">
                      <div class="response-header">
                        <mat-icon>admin_panel_settings</mat-icon>
                        <h4>Official Response</h4>
                        <span class="response-date">{{ formatDate(suggestion.adminResponse.responseDate) }}</span>
                      </div>
                      <div class="response-content">
                        <p>{{ suggestion.adminResponse.response }}</p>
                        <div *ngIf="suggestion.adminResponse.actionTaken" class="action-taken">
                          <strong>Action Taken:</strong> {{ suggestion.adminResponse.actionTaken }}
                        </div>
                        <div class="responder-info">
                          <mat-icon>person</mat-icon>
                          <span>{{ getResponderFullName(suggestion.adminResponse) }}</span>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>

                  <mat-card-actions>
                    <button mat-button color="primary" (click)="openResponseDialog(suggestion)">
                      <mat-icon>reply</mat-icon>
                      {{ suggestion.adminResponse ? 'Update Response' : 'Add Response' }}
                    </button>
                    <button mat-button color="warn" (click)="deleteSuggestion(suggestion)"
                            *ngIf="authService.currentUser?.role === 'superadmin'">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                  </mat-card-actions>
                </mat-card>
              </div>

              <!-- Pagination -->
              <mat-paginator
                *ngIf="!loading && suggestions.length > 0"
                [length]="totalCount"
                [pageSize]="pageSize"
                [pageSizeOptions]="[5, 10, 20, 50]"
                [pageIndex]="currentPage - 1"
                (page)="onPageChange($event)"
                showFirstLastButtons>
              </mat-paginator>
            </div>
          </mat-tab>

          <!-- Statistics Tab -->
          <mat-tab label="Statistics">
            <div class="tab-content">
              <div class="stats-section" *ngIf="stats">
                <h2>Feedback Analytics</h2>
                
                <!-- Category Breakdown -->
                <div class="category-stats">
                  <h3>By Category</h3>
                  <div class="category-grid">
                    <mat-card *ngFor="let category of stats.categories" class="category-card">
                      <mat-card-content>
                        <div class="category-info">
                          <h4>{{ getCategoryLabel(category._id) }}</h4>
                          <div class="category-numbers">
                            <span class="total">{{ category.count }} total</span>
                            <span class="open" *ngIf="category.openCount > 0">{{ category.openCount }} open</span>
                            <span class="resolved" *ngIf="category.resolvedCount > 0">{{ category.resolvedCount }} resolved</span>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>

    <!-- Response Dialog Template (will be created in a real implementation) -->
  `,
  styleUrl: './admin-suggestions.component.scss'
})
export class AdminSuggestionsComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;
  private subscription = new Subscription();

  selectedTab = 0;
  loading = false;

  suggestions: Suggestion[] = [];
  stats: SuggestionStats | null = null;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  filters = {
    type: '',
    status: '',
    category: '',
    priority: '',
    search: ''
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Check admin access
    if (!this.authService.currentUser || !['admin', 'superadmin'].includes(this.authService.currentUser.role)) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadSuggestions();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  loadSuggestions(): void {
    this.loading = true;

    const params: any = {
      page: this.currentPage.toString(),
      limit: this.pageSize.toString()
    };

    // Add filters
    Object.keys(this.filters).forEach(key => {
      if (this.filters[key as keyof typeof this.filters]) {
        params[key] = this.filters[key as keyof typeof this.filters];
      }
    });

    this.subscription.add(
      this.http.get<any>(`${this.apiUrl}/suggestions`, { params }).subscribe({
        next: (response) => {
          if (response.success) {
            this.suggestions = response.data;
            this.totalCount = response.pagination?.totalCount || 0;
          } else {
            this.showMessage('Failed to load suggestions', 'error');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading suggestions:', error);
          this.showMessage('Failed to load suggestions', 'error');
          this.loading = false;
        }
      })
    );
  }

  loadStatistics(): void {
    this.subscription.add(
      this.http.get<any>(`${this.apiUrl}/suggestions/stats`).subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      })
    );
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadSuggestions();
  }

  clearFilters(): void {
    this.filters = {
      type: '',
      status: '',
      category: '',
      priority: '',
      search: ''
    };
    this.applyFilters();
  }

  changeStatus(suggestion: Suggestion, newStatus: string): void {
    this.subscription.add(
      this.http.patch<any>(`${this.apiUrl}/suggestions/${suggestion._id}/status`, { status: newStatus }).subscribe({
        next: (response) => {
          if (response.success) {
            suggestion.status = newStatus as any;
            this.showMessage(`Status updated to ${this.getStatusLabel(newStatus)}`, 'success');
            this.loadStatistics(); // Refresh stats
          } else {
            this.showMessage('Failed to update status', 'error');
          }
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.showMessage('Failed to update status', 'error');
        }
      })
    );
  }

  openResponseDialog(suggestion: Suggestion): void {
    const dialogRef = this.dialog.open(AdminResponseDialogComponent, {
      data: { suggestion },
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(updatedSuggestion => {
      if (updatedSuggestion) {
        // Update the suggestion in the list
        const index = this.suggestions.findIndex(s => s._id === updatedSuggestion._id);
        if (index !== -1) {
          this.suggestions[index] = updatedSuggestion;
        }
        
        // Refresh statistics
        this.loadStatistics();
        
        this.showMessage('Response saved successfully!', 'success');
      }
    });
  }

  deleteSuggestion(suggestion: Suggestion): void {
    const dialogData: ConfirmationDialogData = {
      title: `Delete ${suggestion.type}`,
      message: `Are you sure you want to delete this ${suggestion.type}?`,
      details: `"${suggestion.title}" - This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'error',
      icon: 'delete_forever'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '500px',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.subscription.add(
          this.http.delete<any>(`${this.apiUrl}/suggestions/${suggestion._id}`).subscribe({
            next: (response) => {
              if (response.success) {
                this.showMessage(`${suggestion.type} deleted successfully`, 'success');
                this.loadSuggestions();
                this.loadStatistics();
              } else {
                this.showMessage('Failed to delete suggestion', 'error');
              }
            },
            error: (error) => {
              console.error('Error deleting suggestion:', error);
              this.showMessage('Failed to delete suggestion', 'error');
            }
          })
        );
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadSuggestions();
  }

  getSuggestionClass(suggestion: Suggestion): string {
    const classes = ['suggestion-item'];
    classes.push(`type-${suggestion.type}`);
    classes.push(`status-${suggestion.status}`);
    classes.push(`priority-${suggestion.priority}`);
    return classes.join(' ');
  }

  getSuggestionIcon(suggestion: Suggestion): string {
    if (suggestion.type === 'complaint') {
      return 'report_problem';
    }
    return 'lightbulb';
  }

  getCategoryLabel(category: string): string {
    const categoryMap: Record<string, string> = {
      facility: 'Facility',
      service: 'Service',
      booking: 'Booking',
      payments: 'Payments',
      staff: 'Staff',
      maintenance: 'Maintenance',
      general: 'General'
    };
    return categoryMap[category] || category;
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      open: 'Open',
      in_review: 'Under Review',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUserFullName(suggestion: Suggestion): string | null {
    if (typeof suggestion.userId === 'string') {
      return null;
    }
    return suggestion.userId?.fullName || null;
  }

  getResponderFullName(adminResponse: any): string | null {
    if (!adminResponse || !adminResponse.responderId) {
      return null;
    }
    if (typeof adminResponse.responderId === 'string') {
      return null;
    }
    return adminResponse.responderId?.fullName || null;
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