import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { switchMap, filter, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

interface FinancialAPIResponse {
  success: boolean;
  data: FinancialStatementData;
  message?: string;
  metadata?: {
    source: string;
    lastModified: string;
    cached: boolean;
  };
}

interface FinancialStatementData {
  clubName: string;
  location: string;
  statementTitle: string;
  period: string;
  beginningBalance: {
    date: string;
    amount: number;
  };
  receiptsCollections: Array<{
    description: string;
    amount: number;
    highlighted?: boolean;
  }>;
  totalReceipts: number;
  disbursementsExpenses: Array<{
    description: string;
    amount: number;
  }>;
  totalDisbursements: number;
  netIncome: number;
  fundBalance: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="financial-statement-container">
      <!-- Header with Club Logo and Title -->
      <div class="statement-header" *ngIf="!loading && financialData">
        <div class="club-logo">
          <img src="/images/rt2-logo.png" alt="Rich Town 2 Tennis Club" class="club-logo-img">
        </div>
        <div class="header-content">
          <h1 class="club-name">{{ financialData.clubName }}</h1>
          <p class="club-location">{{ financialData.location }}</p>
          <h2 class="statement-title">{{ financialData.statementTitle }}</h2>
          <p class="statement-period">{{ financialData.period }}</p>
        </div>
        <div class="refresh-section">
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
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner></mat-spinner>
        <p>Loading financial statement...</p>
      </div>

      <!-- Financial Statement Content -->
      <div class="statement-content" *ngIf="!loading && financialData">
        <div class="statement-body">
          <!-- Beginning Balance -->
          <div class="statement-section beginning-balance">
            <div class="section-row">
              <div class="section-title">BEGINNING BALANCE: {{ financialData.beginningBalance.date }}</div>
              <div class="section-amount">{{ formatCurrency(financialData.beginningBalance.amount) }}</div>
            </div>
          </div>

          <!-- Receipts/Collections -->
          <div class="statement-section receipts-section">
            <div class="section-header">
              <div class="section-title">RECEIPTS/COLLECTIONS</div>
            </div>
            <div class="section-items">
              <div class="line-item" *ngFor="let item of getReceiptsWithoutTournament()" 
                   [class.highlighted]="item.highlighted">
                <div class="item-description">{{ item.description }}</div>
                <div class="item-amount">{{ formatCurrency(item.amount) }}</div>
              </div>
            </div>
            <div class="section-total">
              <div class="total-line"></div>
              <div class="total-row">
                <div class="total-description">TOTAL RECEIPTS/COLLECTIONS</div>
                <div class="total-amount">{{ formatCurrency(financialData.totalReceipts) }}</div>
              </div>
            </div>
          </div>

          <!-- Disbursements/Expenses -->
          <div class="statement-section disbursements-section">
            <div class="section-header">
              <div class="section-title">DISBURSEMENTS/EXPENSES</div>
            </div>
            <div class="section-items">
              <div class="line-item" *ngFor="let item of financialData.disbursementsExpenses">
                <div class="item-description">{{ item.description }}</div>
                <div class="item-amount">{{ formatCurrency(item.amount) }}</div>
              </div>
            </div>
            <div class="section-total">
              <div class="total-line"></div>
              <div class="total-row">
                <div class="total-description">TOTAL DISBURSEMENTS/EXPENSES</div>
                <div class="total-amount">({{ formatCurrency(financialData.netIncome) }})</div>
              </div>
            </div>
          </div>

          <!-- Fund Balance -->
          <div class="statement-section fund-balance">
            <div class="section-row final-balance">
              <div class="section-title">FUND BALANCE</div>
              <div class="section-amount">{{ formatCurrency(financialData.fundBalance) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="!loading && error">
        <div class="error-content">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h2>Unable to Load Financial Statement</h2>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./financial-report.component.scss']
})
export class FinancialReportComponent implements OnInit, OnDestroy {
  financialData: FinancialStatementData | null = null;
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
    this.loadFinancialStatement();
    this.initializeWebSocket();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.disconnectWebSocket();
  }

  loadFinancialStatement(): void {
    this.loading = true;
    this.error = null;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    this.http.get<FinancialAPIResponse>(
      `${this.apiUrl}/reports/financial-sheet`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const isDataChanged = this.hasDataChanged(response.data);
          this.financialData = response.data;
          this.lastUpdated = response.metadata?.lastModified || response.data.lastUpdated;
          
          if (isDataChanged && this.lastUpdated) {
            this.snackBar.open('💰 Financial data updated!', 'Close', {
              duration: 4000,
              panelClass: ['success-snack']
            });
          }
        } else {
          this.error = response.message || 'Failed to load financial statement';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading financial statement:', error);
        this.error = error.error?.message || 'Failed to load financial statement';
        this.loading = false;
        this.snackBar.open('Error loading financial statement', 'Close', {
          duration: 5000
        });
      }
    });
  }

  refreshData(): void {
    this.loadFinancialStatement();
  }

  formatCurrency(amount: number): string {
    if (amount === 0) {
      return '0.00';
    }
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private hasDataChanged(newData: FinancialStatementData): boolean {
    if (!this.financialData) return true;
    return JSON.stringify(this.financialData) !== JSON.stringify(newData);
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      this.autoRefreshSubscription = interval(this.REFRESH_INTERVAL)
        .pipe(
          filter(() => this.autoRefreshEnabled),
          switchMap(() => {
            if (!this.loading) {
              return this.http.get<FinancialAPIResponse>(
                `${this.apiUrl}/reports/financial-sheet`,
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
          next: (response: FinancialAPIResponse) => {
            if (response.success) {
              const isDataChanged = this.hasDataChanged(response.data);
              this.financialData = response.data;
              this.lastUpdated = response.metadata?.lastModified || response.data.lastUpdated;
              
              if (isDataChanged) {
                console.log('🔄 Financial data auto-updated');
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
   * Get receipts collection without the Men's Tournament Entries
   */
  getReceiptsWithoutTournament(): any[] {
    if (!this.financialData?.receiptsCollections) return [];
    
    return this.financialData.receiptsCollections.filter(item => 
      !item.description.toLowerCase().includes('tournament entries')
    );
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
        this.socket?.emit('subscribe_financial_updates');
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        this.socketConnected = false;
      });

      // Subscription confirmed
      this.socket.on('subscription_confirmed', (data) => {
        console.log('📊 Subscribed to financial updates:', data);
        this.snackBar.open('🔄 Real-time updates enabled', 'Close', {
          duration: 3000,
          panelClass: ['success-snack']
        });
      });

      // Financial data update events
      this.socket.on('financial_update', (updateEvent) => {
        console.log('📊 Received real-time financial update:', updateEvent);
        
        if (updateEvent.data) {
          const isDataChanged = this.hasDataChanged(updateEvent.data);
          if (isDataChanged) {
            this.financialData = updateEvent.data;
            this.lastUpdated = updateEvent.timestamp;
            
            this.snackBar.open('💰 Financial data updated in real-time!', 'Close', {
              duration: 5000,
              panelClass: ['success-snack']
            });
          }
        }
      });

      // Fallback for general financial data change events
      this.socket.on('financial_data_changed', (data) => {
        console.log('📊 Financial data change notification:', data);
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
      this.socket.emit('unsubscribe_financial_updates');
      this.socket.disconnect();
      this.socket = null;
      this.socketConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Force refresh financial data bypassing cache
   */
  forceRefreshData(): void {
    console.log('🔄 Force refresh requested');
    this.loading = true;
    this.error = null;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    this.http.post<FinancialAPIResponse>(
      `${this.apiUrl}/reports/financial-sheet/force-refresh`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.financialData = response.data;
          this.lastUpdated = response.metadata?.lastModified || response.data.lastUpdated;
          
          this.snackBar.open('🔄 Data force refreshed from Google Sheets!', 'Close', {
            duration: 4000,
            panelClass: ['success-snack']
          });
        } else {
          this.error = response.message || 'Failed to force refresh financial statement';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error force refreshing financial statement:', error);
        this.error = error.error?.message || 'Failed to force refresh financial statement';
        this.loading = false;
        this.snackBar.open('Error force refreshing financial statement', 'Close', {
          duration: 5000,
          panelClass: ['error-snack']
        });
      }
    });
  }
}