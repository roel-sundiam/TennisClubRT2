import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { switchMap, filter, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface CourtUsageAPIResponse {
  success: boolean;
  data: CourtUsageData;
  message?: string;
  metadata?: {
    source: string;
    lastModified: string;
    cached: boolean;
    paymentIntegration?: boolean;
  };
}

interface CourtUsageData {
  summary: {
    totalMembers: number;
    totalReservations: number;
    totalRevenue: string;
    totalPaymentsAdded?: string;
    lastUpdated: string;
    paymentIntegrationTimestamp?: string;
  };
  rawData: Array<any>;
  headers: string[];
}

@Component({
  selector: 'app-court-usage-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="modern-page-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <mat-icon class="page-icon">analytics</mat-icon>
            <div>
              <h1>Court Usage Report</h1>
              <p class="subtitle">Monthly member usage statistics (Jan - Aug 2025)</p>
            </div>
          </div>
          <div class="refresh-section" *ngIf="!loading && reportData">
            <div class="update-status" *ngIf="lastUpdated">
              <span class="last-updated">Updated {{ getTimeAgo(lastUpdated) }}</span>
              <div class="connection-status" *ngIf="socketConnected">
                <mat-icon class="connected-icon">wifi</mat-icon>
                <span class="status-text">Real-time</span>
              </div>
              <div class="auto-refresh-indicator" *ngIf="autoRefreshEnabled && !socketConnected">
                <mat-icon class="pulse-icon">sync</mat-icon>
                <span class="next-update">Next: {{ nextUpdateCountdown }}s</span>
              </div>
            </div>
            <button mat-icon-button (click)="forceRefreshData()" class="force-refresh-btn" [disabled]="loading" title="Force Refresh from Google Sheets">
              <mat-icon [class.spin]="loading">cloud_download</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleAutoRefresh()" [class.active]="autoRefreshEnabled" title="Toggle Auto-refresh">
              <mat-icon>{{ autoRefreshEnabled ? 'sync' : 'sync_disabled' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="refreshData()" class="refresh-btn" [disabled]="loading" title="Refresh Data">
              <mat-icon [class.spin]="loading">refresh</mat-icon>
            </button>
          </div>
          <div class="header-stats" *ngIf="!loading && reportData">
            <div class="stat-item">
              <mat-icon>people</mat-icon>
              <span>{{ reportData.summary.totalMembers }} Active Members</span>
            </div>
            <div class="stat-item">
              <mat-icon>monetization_on</mat-icon>
              <span>{{ reportData.summary.totalRevenue }} Total Revenue</span>
            </div>
            <div class="stat-item" *ngIf="reportData.summary.totalPaymentsAdded">
              <mat-icon>add_circle</mat-icon>
              <span>{{ reportData.summary.totalPaymentsAdded }} Added from Payments</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner></mat-spinner>
        <p>Loading court usage data...</p>
      </div>

      <!-- Main Content -->
      <div class="content-section" *ngIf="!loading && reportData">
        <!-- Modern Data Table -->
        <div class="modern-table-container">
          <div class="table-header">
            <div class="table-title">
              <mat-icon>table_chart</mat-icon>
              <h2>Member Monthly Usage</h2>
            </div>
            <button mat-icon-button (click)="refreshData()" class="refresh-btn" title="Refresh Data">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
          
          <div class="table-wrapper">
            <table mat-table [dataSource]="reportData.rawData" class="modern-data-table">
              <ng-container *ngFor="let column of reportData.headers; trackBy: trackByColumn" [matColumnDef]="column">
                <th mat-header-cell *matHeaderCellDef 
                    [ngClass]="['table-header-cell', column === 'PLAYRERS/MEMBERS' ? 'frozen-header-cell' : '']">
                  {{ column }}
                </th>
                <td mat-cell *matCellDef="let element" 
                    [ngClass]="{
                      'member-name-cell': column === 'PLAYRERS/MEMBERS',
                      'total-cell': column === 'Total',
                      'amount-cell': column !== 'PLAYRERS/MEMBERS' && column !== 'Total'
                    }">
                  {{ element[column] }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="reportData.headers; sticky: true" class="table-header-row"></tr>
              <tr mat-row *matRowDef="let row; columns: reportData.headers;" class="table-data-row"></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="!loading && error">
        <div class="error-content">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h2>Unable to Load Report</h2>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./court-usage-report.component.scss']
})
export class CourtUsageReportComponent implements OnInit, OnDestroy {
  reportData: CourtUsageData | null = null;
  loading = true;
  error: string | null = null;
  lastUpdated: string | null = null;
  autoRefreshEnabled = true;
  nextUpdateCountdown = 30;
  
  private apiUrl = environment.apiUrl;
  private autoRefreshSubscription?: Subscription;
  private countdownSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds
  private socket: Socket | null = null;
  public socketConnected = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCourtUsageData();
    this.initializeWebSocket();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.disconnectWebSocket();
  }

  loadCourtUsageData(): void {
    this.loading = true;
    this.error = null;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    this.http.get<CourtUsageAPIResponse>(
      `${this.apiUrl}/reports/court-usage-sheet`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const isDataChanged = this.hasDataChanged(response.data);
          this.reportData = response.data;
          this.lastUpdated = response.metadata?.lastModified || response.data.summary.lastUpdated;
          
          if (isDataChanged && this.lastUpdated) {
            this.snackBar.open('🏸 Court usage data updated!', 'Close', {
              duration: 4000,
              panelClass: ['success-snack']
            });
          }
        } else {
          this.error = response.message || 'Failed to load court usage data';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading court usage data:', error);
        this.error = error.error?.message || 'Failed to load court usage data';
        this.loading = false;
        this.snackBar.open('Error loading court usage report', 'Close', {
          duration: 5000
        });
      }
    });
  }

  refreshData(): void {
    this.loadCourtUsageData();
  }

  getLastUpdated(): string {
    if (!this.reportData?.summary.lastUpdated) return '';
    const date = new Date(this.reportData.summary.lastUpdated);
    return date.toLocaleDateString();
  }

  trackByColumn(index: number, column: string): string {
    return column;
  }

  private hasDataChanged(newData: CourtUsageData): boolean {
    if (!this.reportData) return true;
    return JSON.stringify(this.reportData) !== JSON.stringify(newData);
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      this.autoRefreshSubscription = interval(this.REFRESH_INTERVAL)
        .pipe(
          filter(() => this.autoRefreshEnabled),
          switchMap(() => {
            if (!this.loading) {
              return this.http.get<CourtUsageAPIResponse>(
                `${this.apiUrl}/reports/court-usage-sheet`,
                {
                  headers: new HttpHeaders({
                    'Authorization': `Bearer ${this.authService.token}`
                  })
                }
              );
            }
            return [];
          })
        )
        .subscribe({
          next: (response: CourtUsageAPIResponse) => {
            if (response.success) {
              const isDataChanged = this.hasDataChanged(response.data);
              this.reportData = response.data;
              this.lastUpdated = response.metadata?.lastModified || response.data.summary.lastUpdated;
              
              if (isDataChanged) {
                console.log('🔄 Court usage data auto-updated');
                this.snackBar.open('📊 Data refreshed automatically', 'Close', {
                  duration: 2000,
                  panelClass: ['info-snack']
                });
              }
            }
          },
          error: (error) => {
            console.error('Auto-refresh error:', error);
          }
        });

      this.startCountdown();
    }
  }

  private startCountdown(): void {
    this.nextUpdateCountdown = this.REFRESH_INTERVAL / 1000;
    this.countdownSubscription = interval(1000).subscribe(() => {
      if (this.nextUpdateCountdown > 0) {
        this.nextUpdateCountdown--;
      } else {
        this.nextUpdateCountdown = this.REFRESH_INTERVAL / 1000;
      }
    });
  }

  private stopAutoRefresh(): void {
    this.autoRefreshSubscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
      this.snackBar.open('🔄 Auto-refresh enabled', 'Close', {
        duration: 2000,
        panelClass: ['success-snack']
      });
    } else {
      this.stopAutoRefresh();
      this.snackBar.open('⏸️ Auto-refresh disabled', 'Close', {
        duration: 2000,
        panelClass: ['info-snack']
      });
    }
  }

  getTimeAgo(dateString: string): string {
    const now = new Date().getTime();
    const updated = new Date(dateString).getTime();
    const diffSeconds = Math.floor((now - updated) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket(): void {
    try {
      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token: this.authService.token
        }
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        this.socketConnected = true;
        this.socket?.emit('subscribe_court_usage_updates');
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        this.socketConnected = false;
      });

      // Subscription confirmed
      this.socket.on('subscription_confirmed', (data) => {
        console.log('🏸 Subscribed to court usage updates:', data);
        this.snackBar.open('🔄 Real-time updates enabled', 'Close', {
          duration: 3000,
          panelClass: ['success-snack']
        });
      });

      // Court usage data update events
      this.socket.on('court_usage_update', (updateEvent) => {
        console.log('🏸 Received real-time court usage update:', updateEvent);
        
        if (updateEvent.data) {
          const isDataChanged = this.hasDataChanged(updateEvent.data);
          if (isDataChanged) {
            this.reportData = updateEvent.data;
            this.lastUpdated = updateEvent.timestamp;
            
            this.snackBar.open('🏸 Court usage data updated in real-time!', 'Close', {
              duration: 5000,
              panelClass: ['success-snack']
            });
          }
        }
      });

      // Fallback for general court usage data change events
      this.socket.on('court_usage_data_changed', (data) => {
        console.log('🏸 Court usage data change notification:', data);
        this.snackBar.open(`🔄 ${data.message}`, 'Refresh', {
          duration: 6000,
          panelClass: ['info-snack']
        }).onAction().subscribe(() => {
          this.refreshData();
        });
      });

      // Handle connection errors
      this.socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        this.socketConnected = false;
      });

    } catch (error) {
      console.error('🔌 Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.emit('unsubscribe_court_usage_updates');
      this.socket.disconnect();
      this.socket = null;
      this.socketConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Force refresh court usage data bypassing cache
   */
  forceRefreshData(): void {
    console.log('🔄 Force refresh requested');
    this.loading = true;
    this.error = null;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    this.http.post<CourtUsageAPIResponse>(
      `${this.apiUrl}/reports/court-usage-sheet/force-refresh`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.reportData = response.data;
          this.lastUpdated = response.metadata?.lastModified || response.data.summary.lastUpdated;
          
          this.snackBar.open('🔄 Data force refreshed from Google Sheets!', 'Close', {
            duration: 4000,
            panelClass: ['success-snack']
          });
        } else {
          this.error = response.message || 'Failed to force refresh court usage report';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error force refreshing court usage report:', error);
        this.error = error.error?.message || 'Failed to force refresh court usage report';
        this.loading = false;
        this.snackBar.open('Error force refreshing court usage report', 'Close', {
          duration: 5000,
          panelClass: ['error-snack']
        });
      }
    });
  }

}