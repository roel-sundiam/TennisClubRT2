import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { canCancelReservation } from '../../utils/date-validation.util';

interface Reservation {
  _id: string;
  date: Date;
  timeSlot: number;
  timeSlotDisplay: string;
  players: string[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'overdue';
  totalFee: number;
  feePerPlayer: number;
  userId?: {
    _id: string;
    username: string;
    fullName: string;
  };
  weatherForecast?: {
    temperature: number;
    description: string;
    icon: string;
    rainChance?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  isHomeownerDay?: boolean; // Flag for Homeowner's Day entries
}

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <!-- Modern page structure following design system -->
    <div class="page-container">
      <div class="page-content">
        <!-- Page Header with Action -->
        <div class="page-header">
          <div class="page-title-section">
            <div class="page-title">
              <mat-icon class="page-icon">event</mat-icon>
              <h1>My Reservations</h1>
            </div>
            <p class="page-subtitle">View and manage your court bookings</p>
          </div>
          <div class="page-actions">
            <button mat-raised-button class="btn-primary" (click)="createNewReservation()">
              <mat-icon>add</mat-icon>
              Book Court
            </button>
          </div>
        </div>

        <div class="content-wrapper">
        <mat-tab-group class="reservations-tabs modern-compact-tabs" (selectedTabChange)="onTabChange($event)">
          <!-- All Reservations -->
          <mat-tab [label]="getTabLabel('all')" [disabled]="loading">
            <div class="tab-content">
              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading all reservations...</p>
              </div>
              
              <div *ngIf="!loading && allReservations.length === 0" class="no-reservations">
                <mat-icon class="large-icon">event_note</mat-icon>
                <h2>No Reservations Found</h2>
                <p>No court reservations have been made by any members yet.</p>
                <button mat-raised-button color="primary" (click)="createNewReservation()">
                  <mat-icon>add</mat-icon>
                  Book a Court
                </button>
              </div>
              
              <div *ngIf="!loading && allReservations.length > 0" class="reservations-list">
                <!-- NEW COMPACT DESIGN LOADED -->
                <div *ngFor="let reservation of allReservations" 
                     class="reservation-card-compact all-reservations"
                     [class.homeowner-day]="reservation.isHomeownerDay"
                     [style.border-left-color]="getWeatherBorderColor(reservation)">
                  <div class="card-left">
                    <div class="date-badge" [ngClass]="isPastReservation(reservation.date) ? 'past' : ''">
                      <span class="date-day">{{getDay(reservation.date)}}</span>
                      <span class="date-info">{{getShortDate(reservation.date)}}</span>
                    </div>
                    <div class="reservation-main show-user-info">
                      <div class="time-slot">{{reservation.timeSlotDisplay}}</div>
                      <div class="user-info" *ngIf="reservation.userId">
                        <mat-icon class="inline-icon">person</mat-icon>
                        <span class="user-text">{{reservation.userId.fullName}}</span>
                      </div>
                      <div class="players-info">
                        <mat-icon class="inline-icon">people</mat-icon>
                        <span class="players-text">{{getFilteredPlayers(reservation).join(', ')}}</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="status-chips">
                      <mat-chip *ngIf="reservation.status !== 'pending'" class="status-chip" [ngClass]="'status-' + reservation.status">
                        {{reservation.status | titlecase}}
                      </mat-chip>
                    </div>
                    <div class="fee-weather">
                      <span class="fee">₱{{reservation.totalFee}}</span>
                      <span class="weather" *ngIf="reservation.weatherForecast">
                        <mat-icon class="weather-icon">{{getWeatherIcon(reservation.weatherForecast.icon)}}</mat-icon>
                        {{reservation.weatherForecast.temperature}}°C
                        <span class="rain-chance" *ngIf="reservation.weatherForecast.rainChance !== undefined">
                          {{reservation.weatherForecast.rainChance}}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
          
          <!-- Upcoming Reservations -->
          <mat-tab [label]="getTabLabel('upcoming')" [disabled]="loading">
            <div class="tab-content">
              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading your reservations...</p>
              </div>
              
              <div *ngIf="!loading && upcomingReservations.length === 0" class="no-reservations">
                <mat-icon class="large-icon">event_busy</mat-icon>
                <h2>No Upcoming Reservations</h2>
                <p>You don't have any upcoming court reservations.</p>
                <button mat-raised-button color="primary" (click)="createNewReservation()">
                  <mat-icon>add</mat-icon>
                  Book Your First Court
                </button>
              </div>
              
              <div *ngIf="!loading" class="reservations-list">
                <div *ngFor="let reservation of upcomingReservations" class="reservation-card-compact">
                  <!-- Mobile Action Buttons (Upper Right Corner) -->
                  <div class="card-actions-mobile" *ngIf="isMobileView">
                    <button mat-icon-button class="action-btn edit-btn"
                            (click)="editReservation(reservation)"
                            [disabled]="!canEdit(reservation)"
                            matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button class="action-btn cancel-btn"
                            (click)="cancelReservation(reservation)"
                            [disabled]="!canCancel(reservation)"
                            matTooltip="Cancel">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>

                  <div class="card-left">
                    <div class="date-badge">
                      <span class="date-day">{{getDay(reservation.date)}}</span>
                      <span class="date-info">{{getShortDate(reservation.date)}}</span>
                    </div>
                    <div class="reservation-main">
                      <div class="time-slot">{{reservation.timeSlotDisplay}}</div>
                      <div class="players-info">
                        <mat-icon class="inline-icon">people</mat-icon>
                        <span class="players-text">{{reservation.players.join(', ')}}</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="status-chips">
                      <mat-chip *ngIf="reservation.status !== 'pending'" class="status-chip" [ngClass]="'status-' + reservation.status">
                        {{reservation.status | titlecase}}
                      </mat-chip>
                      <mat-chip class="payment-chip" [ngClass]="'payment-' + reservation.paymentStatus">
                        {{getPaymentStatusText(reservation.paymentStatus)}}
                      </mat-chip>
                    </div>
                    <div class="fee-weather">
                      <span class="fee">₱{{reservation.totalFee}}</span>
                      <span class="weather" *ngIf="reservation.weatherForecast">
                        <mat-icon class="weather-icon">{{getWeatherIcon(reservation.weatherForecast.icon)}}</mat-icon>
                        {{reservation.weatherForecast.temperature}}°C
                        <span class="rain-chance" *ngIf="reservation.weatherForecast.rainChance !== undefined">
                          {{reservation.weatherForecast.rainChance}}%
                        </span>
                      </span>
                    </div>
                    <!-- Desktop Action Buttons (Bottom Right) -->
                    <div class="card-actions" *ngIf="!isMobileView">
                      <button mat-icon-button class="action-btn edit-btn"
                              (click)="editReservation(reservation)"
                              [disabled]="!canEdit(reservation)"
                              matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button class="action-btn cancel-btn"
                              (click)="cancelReservation(reservation)"
                              [disabled]="!canCancel(reservation)"
                              matTooltip="Cancel">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
          
          <!-- Past Reservations -->
          <mat-tab [label]="getTabLabel('history')" [disabled]="loading">
            <div class="tab-content">
              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading reservation history...</p>
              </div>

              <div *ngIf="!loading && pastReservations.length === 0" class="no-reservations">
                <mat-icon class="large-icon">history</mat-icon>
                <h2>No Past Reservations</h2>
                <p>Your reservation history will appear here.</p>
              </div>

              <div *ngIf="!loading" class="reservations-list">
                <div *ngFor="let reservation of pastReservations" class="reservation-card-compact past">
                  <div class="card-left">
                    <div class="date-badge past">
                      <span class="date-day">{{getDay(reservation.date)}}</span>
                      <span class="date-info">{{getShortDate(reservation.date)}}</span>
                    </div>
                    <div class="reservation-main">
                      <div class="time-slot">{{reservation.timeSlotDisplay}}</div>
                      <div class="players-info">
                        <mat-icon class="inline-icon">people</mat-icon>
                        <span class="players-text">{{reservation.players.join(', ')}}</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="status-chips">
                      <mat-chip *ngIf="reservation.status !== 'pending'" class="status-chip" [ngClass]="'status-' + reservation.status">
                        {{reservation.status | titlecase}}
                      </mat-chip>
                    </div>
                    <div class="fee-weather">
                      <span class="fee">₱{{reservation.totalFee}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Admin Report Tab (Superadmin Only) -->
          <mat-tab *ngIf="isSuperAdmin()" [label]="isMobileView ? 'Admin' : 'Admin Report'" [disabled]="loading">
            <div class="tab-content">
              <!-- Summary Statistics Card -->
              <div class="admin-stats-card" *ngIf="!loading && sortedAdminReservations.length > 0">
                <h3>
                  <mat-icon>analytics</mat-icon>
                  Report Summary
                </h3>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-label">Total Reservations</span>
                    <span class="stat-value">{{adminStats.total}}</span>
                  </div>
                  <div class="stat-item status-pending">
                    <span class="stat-label">Pending</span>
                    <span class="stat-value">{{adminStats.pending}}</span>
                  </div>
                  <div class="stat-item status-confirmed">
                    <span class="stat-label">Confirmed</span>
                    <span class="stat-value">{{adminStats.confirmed}}</span>
                  </div>
                  <div class="stat-item status-cancelled">
                    <span class="stat-label">Cancelled</span>
                    <span class="stat-value">{{adminStats.cancelled}}</span>
                  </div>
                  <div class="stat-item status-completed">
                    <span class="stat-label">Completed</span>
                    <span class="stat-value">{{adminStats.completed}}</span>
                  </div>
                  <div class="stat-item revenue-total">
                    <span class="stat-label">Total Revenue</span>
                    <span class="stat-value">₱{{adminStats.totalRevenue}}</span>
                  </div>
                  <div class="stat-item revenue-paid">
                    <span class="stat-label">Paid Revenue</span>
                    <span class="stat-value">₱{{adminStats.paidRevenue}}</span>
                  </div>
                  <div class="stat-item revenue-pending">
                    <span class="stat-label">Pending Revenue</span>
                    <span class="stat-value">₱{{adminStats.pendingRevenue}}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading admin report...</p>
              </div>

              <div *ngIf="!loading && sortedAdminReservations.length === 0" class="no-reservations">
                <mat-icon class="large-icon">assessment</mat-icon>
                <h2>No Reservations Data</h2>
                <p>No court reservations found in the system.</p>
              </div>

              <div *ngIf="!loading && sortedAdminReservations.length > 0" class="reservations-list">
                <div *ngFor="let reservation of sortedAdminReservations; let idx = index"
                     class="reservation-card-compact admin-report"
                     [class.cancelled-reservation]="reservation.status === 'cancelled'"
                     [class.completed-reservation]="reservation.status === 'completed'"
                     [style.border-left-color]="getWeatherBorderColor(reservation)">
                  <div class="card-left">
                    <div class="date-badge"
                         [ngClass]="{
                           'past': isPastReservation(reservation.date),
                           'cancelled': reservation.status === 'cancelled'
                         }">
                      <span class="date-day">{{getDay(reservation.date)}}</span>
                      <span class="date-info">{{getShortDate(reservation.date)}}</span>
                    </div>
                    <div class="reservation-main show-user-info">
                      <div class="time-slot">{{reservation.timeSlotDisplay}}</div>
                      <div class="user-info" *ngIf="reservation.userId">
                        <mat-icon class="inline-icon">person</mat-icon>
                        <span class="user-text">{{reservation.userId.fullName}}</span>
                      </div>
                      <div class="players-info">
                        <mat-icon class="inline-icon">people</mat-icon>
                        <span class="players-text">{{getFilteredPlayers(reservation).join(', ')}}</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="status-chips">
                      <mat-chip class="status-chip" [ngClass]="'status-' + reservation.status">
                        {{reservation.status | titlecase}}
                      </mat-chip>
                      <mat-chip class="payment-chip" [ngClass]="'payment-' + reservation.paymentStatus">
                        {{getPaymentStatusText(reservation.paymentStatus)}}
                      </mat-chip>
                    </div>
                    <div class="fee-weather">
                      <span class="fee">₱{{reservation.totalFee}}</span>
                      <span class="weather" *ngIf="reservation.weatherForecast">
                        <mat-icon class="weather-icon">{{getWeatherIcon(reservation.weatherForecast.icon)}}</mat-icon>
                        {{reservation.weatherForecast.temperature}}°C
                        <span class="rain-chance" *ngIf="reservation.weatherForecast.rainChance !== undefined">
                          {{reservation.weatherForecast.rainChance}}%
                        </span>
                      </span>
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

    <!-- Cancel Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="closeCancelModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Cancel Reservation</h2>
          <button class="modal-close" (click)="closeCancelModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>Are you sure you want to cancel this reservation?</p>
          <div class="reservation-details" *ngIf="reservationToCancel">
            <strong>Date:</strong> {{reservationToCancel.date | date:'fullDate'}}<br>
            <strong>Time:</strong> {{reservationToCancel.timeSlotDisplay}}<br>
            <strong>Players:</strong> {{reservationToCancel.players.join(', ')}}
          </div>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="closeCancelModal()">
            Keep Reservation
          </button>
          <button class="btn-danger" (click)="confirmCancelReservation()">
            Yes, Cancel Reservation
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './my-reservations.component.scss'
})
export class MyReservationsComponent implements OnInit, OnDestroy {
  upcomingReservations: Reservation[] = [];
  pastReservations: Reservation[] = [];
  allReservations: Reservation[] = [];
  adminReservations: Reservation[] = [];
  sortedAdminReservations: Reservation[] = [];
  loading = true;
  currentTab = 0;

  // Admin statistics
  adminStats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0
  };
  
  // Responsive tab labels for modern compact design
  isMobileView = false;
  
  // Cancel modal state
  showCancelModal = false;
  reservationToCancel: Reservation | null = null;
  
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('🚀 MyReservationsComponent ngOnInit called');
    console.log('🚀 User authenticated:', this.authService.isAuthenticated());
    console.log('🚀 Current user:', this.authService.currentUser);
    
    // Initialize responsive tab detection
    this.checkScreenSize();
    
    // Test backend connectivity first
    this.testBackendConnectivity();
  }

  ngOnDestroy(): void {
    // Cleanup any subscriptions if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768;
  }

  /**
   * Get responsive tab labels based on screen size
   */
  getTabLabel(tabType: 'upcoming' | 'history' | 'all'): string {
    const labels = {
      upcoming: this.isMobileView ? 'Up' : 'Upcoming',
      history: this.isMobileView ? 'Past' : 'History',
      all: this.isMobileView ? 'All' : 'All Reservations'
    };
    return labels[tabType];
  }

  private testBackendConnectivity(): void {
    console.log('🔌 Testing backend connectivity...');
    
    // Try /health endpoint first (without /api prefix)
    this.http.get<any>('${environment.apiBaseUrl}/health')
      .pipe(
        timeout(5000),
        catchError(error => {
          console.warn('⚠️ /health endpoint failed, trying /api/health:', error);
          // Fallback to /api/health endpoint
          return this.http.get<any>(`${this.apiUrl}/health`).pipe(
            timeout(5000),
            catchError(apiError => {
              console.error('❌ Both health endpoints failed');
              console.error('- /health error:', error);
              console.error('- /api/health error:', apiError);
              throw apiError;
            })
          );
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Backend health check passed:', response);
          // Backend is running, proceed to load reservations
          this.loadReservations();
        },
        error: (error) => {
          console.error('❌ Backend connectivity test failed:', error);
          this.handleBackendConnectivityError();
        }
      });
  }

  private handleBackendConnectivityError(): void {
    this.loading = false;
    
    // Show a comprehensive error message with clear instructions
    this.snackBar.open(
      'Backend server connection failed. Please start the backend server first.',
      'Show Instructions',
      {
        duration: 0, // Don't auto-dismiss
        panelClass: ['error-snackbar']
      }
    ).onAction().subscribe(() => {
      // User clicked "Show Instructions" - display detailed startup guide
      this.showBackendStartupInstructions();
    });
    
    // Show empty state immediately so page is usable
    this.upcomingReservations = [];
    this.pastReservations = [];
    this.allReservations = [];
    
    console.log('🚨 BACKEND CONNECTION FAILED - TROUBLESHOOTING GUIDE:');
    console.log('');
    console.log('📋 STEP 1: Open a new terminal');
    console.log('📋 STEP 2: Navigate to backend directory: cd backend');
    console.log('📋 STEP 3: Start the server: npm run dev');
    console.log('📋 STEP 4: Wait for "🚀 Rich Town 2 Tennis Club Backend running on port 3000"');
    console.log('📋 STEP 5: Refresh this page');
    console.log('');
    console.log('💡 Alternative: Run "./start-backend.sh" from project root');
    console.log('');
    console.log('🔍 If still having issues:');
    console.log('   • Check port 3000 is not in use: lsof -i :3000');
    console.log('   • Verify MongoDB connection in backend logs');
    console.log('   • Ensure .env file exists in backend folder');
  }

  private showBackendStartupInstructions(): void {
    const instructions = `
BACKEND SERVER STARTUP GUIDE

📋 Quick Start:
1. Open a new terminal window
2. Navigate to backend: cd backend  
3. Start server: npm run dev
4. Wait for success message
5. Refresh this page

💡 Alternative Method:
Run: ./start-backend.sh

🔍 Troubleshooting:
• Port conflict: lsof -i :3000
• MongoDB issues: Check backend logs
• Missing config: Verify .env file exists

Once you see "🚀 Rich Town 2 Tennis Club Backend running on port 3000", 
click "Try Again" below to reconnect.
    `;
    
    console.log(instructions);
    
    // Provide try again option
    this.snackBar.open(
      'Ready to test connection again?',
      'Try Again',
      {
        duration: 0,
        panelClass: ['info-snackbar']
      }
    ).onAction().subscribe(() => {
      this.loading = true;
      this.testBackendConnectivity();
    });
  }

  loadReservations(): void {
    console.log('📡 Starting loadReservations...');
    this.loading = true;
    
    console.log('📡 Making HTTP request to:', `${this.apiUrl}/reservations/my-upcoming`);
    console.log('📡 Auth token available:', !!this.authService.token);
    
    this.http.get<any>(`${this.apiUrl}/reservations/my-upcoming`)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(error => {
          console.error('❌ HTTP request timed out or failed:', error);
          throw error;
        })
      )
      .subscribe({
      next: (response) => {
        console.log('✅ HTTP request successful, processing response...');
        console.log('🔍 MY-UPCOMING Response received:', response);
        const reservations = response.data || response;
        console.log('🔍 Parsed reservations:', reservations.length);
        console.log('🔍 Raw reservations data:', reservations.map((r: any) => ({
          id: r._id,
          date: r.date,
          timeSlot: r.timeSlot,
          status: r.status,
          players: r.players
        })));
        
        const now = new Date();
        console.log('🔍 Current time for filtering:', now);
        
        // Group and process reservations to handle time ranges
        // Consider time slots: if it's today but future time slot, it's still upcoming
        const upcomingRaw = reservations.filter((r: any) => {
          const reservationDate = new Date(r.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          reservationDate.setHours(0, 0, 0, 0);
          
          // If future date, it's upcoming
          if (reservationDate > today) {
            return true;
          }
          
          // If today, check if the time slot hasn't passed yet
          if (reservationDate.getTime() === today.getTime()) {
            const currentHour = now.getHours();
            console.log(`🔍 Today reservation: timeSlot ${r.timeSlot} vs currentHour ${currentHour} = ${r.timeSlot > currentHour ? 'UPCOMING' : 'PAST'}`);
            return r.timeSlot > currentHour;
          }
          
          // Past date
          return false;
        });
        
        const pastRaw = reservations.filter((r: any) => {
          const reservationDate = new Date(r.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          reservationDate.setHours(0, 0, 0, 0);
          
          // If past date, it's past
          if (reservationDate < today) {
            return true;
          }
          
          // If today, check if the time slot has already passed
          if (reservationDate.getTime() === today.getTime()) {
            const currentHour = now.getHours();
            return r.timeSlot <= currentHour;
          }
          
          // Future date
          return false;
        });
        
        console.log('🔍 Before grouping - Upcoming:', upcomingRaw.length, 'Past:', pastRaw.length);
        
        this.upcomingReservations = this.groupConsecutiveReservations(upcomingRaw);
        this.pastReservations = this.groupConsecutiveReservations(pastRaw);
        
        // Ensure all time displays use AM/PM format
        this.convertToAMPMFormat(this.upcomingReservations);
        this.convertToAMPMFormat(this.pastReservations);
        
        // Add weather data to upcoming reservations for testing
        this.addWeatherToUpcomingReservations();
        
        console.log('📊 Personal Reservations loaded:');
        console.log('- Upcoming:', this.upcomingReservations.length);
        console.log('- Past:', this.pastReservations.length);
        
        this.loading = false;
        
        // Load all reservations since it's now the first tab (without showing loading again)
        this.loadAllReservations(false);

        // Also load admin reservations if user is admin
        const user = this.authService.currentUser;
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          console.log('✅ Admin user detected, loading admin reservations on init');
          this.loadAdminReservations(false);
        }
      },
      error: (error) => {
        console.error('❌ HTTP request failed:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.error);
        
        this.loading = false;
        
        let errorMessage = 'Failed to load reservations';
        if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        }
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onTabChange(event: any): void {
    this.currentTab = event.index;
    console.log('🔄 Tab changed to index:', event.index);

    // Load all reservations when switching to "All Reservations" tab (index 0)
    if (event.index === 0) {
      console.log('📋 Loading All Reservations tab');
      this.loadAllReservations();
    }

    // Load admin report when switching to "Admin Report" tab (index 3)
    if (event.index === 3) {
      console.log('📋 Loading Admin Report tab');
      this.loadAdminReservations(true);
    }
  }

  loadAllReservations(showLoading: boolean = true): void {
    console.log('Loading all reservations from all users...');
    if (showLoading) {
      this.loading = true;
    }

    // Use the general reservations endpoint with showAll=true to get all reservations
    // Set high limit to fetch all reservations (default is 10)
    const timestamp = new Date().getTime();
    this.http.get<any>(`${this.apiUrl}/reservations?showAll=true&limit=1000&_t=${timestamp}`).subscribe({
      next: (response) => {
        const reservations = response.data || [];
        console.log('🔍 Raw reservations received:', reservations.length);
        console.log('🔍 Sample reservation users:', reservations.slice(0, 3).map((r: any) => ({ 
          id: r._id, 
          user: r.userId?.fullName || 'No user', 
          status: r.status,
          date: r.date,
          players: r.players 
        })));
        
        // Filter out cancelled reservations and past date/time reservations
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        
        const activeReservations = reservations.filter((r: any) => {
          if (r.status === 'cancelled') return false;
          
          const reservationDate = new Date(r.date);
          reservationDate.setHours(0, 0, 0, 0);
          
          // Future dates: include
          if (reservationDate > today) return true;
          
          // Past dates: exclude
          if (reservationDate < today) return false;
          
          // Today: check if reservation end time hasn't passed yet
          if (reservationDate.getTime() === today.getTime()) {
            const currentHour = now.getHours();
            const endHour = r.endTimeSlot || (r.timeSlot + (r.duration || 1));
            return endHour > currentHour; // Show until entire reservation time is over
          }
          
          return false;
        });
        console.log('🔍 Active reservations before grouping:', activeReservations.length);
        console.log('🔍 Active reservations details:', activeReservations.map(r => ({
          id: r._id,
          user: r.userId?.fullName,
          date: r.date,
          timeSlot: r.timeSlot,
          players: r.players
        })));
        
        this.allReservations = this.groupConsecutiveReservations(activeReservations);

        // Ensure all time displays use AM/PM format
        this.convertToAMPMFormat(this.allReservations);
        console.log('🔍 After grouping:', this.allReservations.length);
        
        // Add mock rain chance data to a few reservations for testing
        this.addMockRainChanceForTesting();
        
        // Add Homeowner's Day entries for upcoming Wednesdays
        this.addHomeownerDayEntries();
        
        console.log('📊 All Reservations loaded:');
        console.log('- Total from all users (excluding cancelled):', this.allReservations.length);
        console.log('- Cancelled reservations filtered out:', reservations.length - activeReservations.length);
        
        if (showLoading) {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading all reservations:', error);
        if (showLoading) {
          this.loading = false;
        }
        this.snackBar.open('Failed to load all reservations', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadAdminReservations(showLoading: boolean = true): void {
    console.log('📊 Loading admin reservations report...');
    if (showLoading) {
      this.loading = true;
    }

    // Fetch ALL reservations without any filtering - no status filter, no date filter
    const timestamp = new Date().getTime();
    this.http.get<any>(`${this.apiUrl}/reservations?showAll=true&limit=10000&_t=${timestamp}`).subscribe({
      next: (response) => {
        console.log('📊 ADMIN REPORT - Full response:', response);
        const reservations = response.data || [];
        console.log('🔍 Admin Report - Raw reservations received:', reservations.length);
        console.log('🔍 First reservation raw data:', reservations[0]);
        console.log('🔍 Status breakdown before filtering:', {
          pending: reservations.filter((r: any) => r.status === 'pending').length,
          confirmed: reservations.filter((r: any) => r.status === 'confirmed').length,
          cancelled: reservations.filter((r: any) => r.status === 'cancelled').length,
          completed: reservations.filter((r: any) => r.status === 'completed').length
        });

        // Sort reservations in DESCENDING order (newest first)
        this.adminReservations = reservations.sort((a: any, b: any) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          // If same date, sort by time slot descending
          return b.timeSlot - a.timeSlot;
        });

        // Convert time displays to AM/PM format
        this.convertToAMPMFormat(this.adminReservations);

        console.log('📊 Admin reservations loaded:', this.adminReservations.length);

        // Calculate statistics
        this.calculateAdminStats(reservations);

        // Update sorted array for template binding
        this.sortedAdminReservations = this.getSortedAdminReservations();

        console.log('📊 Admin Report loaded - Total:', this.adminReservations.length, 'Sorted (descending):', this.sortedAdminReservations.length);

        if (showLoading) {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading admin reservations:', error);
        if (showLoading) {
          this.loading = false;
        }
        this.snackBar.open('Failed to load admin report', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  calculateAdminStats(reservations: any[]): void {
    this.adminStats = {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'pending').length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      totalRevenue: reservations.reduce((sum, r) => sum + (r.totalFee || 0), 0),
      paidRevenue: reservations.filter(r => r.paymentStatus === 'paid').reduce((sum, r) => sum + (r.totalFee || 0), 0),
      pendingRevenue: reservations.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + (r.totalFee || 0), 0)
    };
  }

  isAdmin(): boolean {
    const user = this.authService.currentUser;
    console.log('🔐 isAdmin check - Current user:', user);
    console.log('🔐 User role:', user?.role);
    const result = user?.role === 'admin' || user?.role === 'superadmin';
    console.log('🔐 isAdmin result:', result);
    return result;
  }

  isSuperAdmin(): boolean {
    const user = this.authService.currentUser;
    return user?.role === 'superadmin'; // Only superadmins see Admin Report tab
  }

  getSortedAdminReservations(): Reservation[] {
    // For admin report, use adminReservations if available, otherwise use allReservations
    const source = this.adminReservations.length > 0 ? this.adminReservations : this.allReservations;

    // Sort in DESCENDING order - newest dates first, then highest time slots first
    return [...source].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // Sort by date descending (newest first)
      if (dateB !== dateA) {
        return dateB - dateA;
      }

      // Same date: sort by time slot descending (latest time first)
      return b.timeSlot - a.timeSlot;
    });
  }

  groupConsecutiveReservationsDescending(reservations: any[]): Reservation[] {
    // Assumes reservations are already sorted in DESCENDING order
    // Does NOT re-sort to preserve the descending order
    const grouped: Reservation[] = [];
    let i = 0;

    while (i < reservations.length) {
      const current = reservations[i];
      const consecutiveGroup = [current];

      // Find consecutive reservations for the same date (in descending order)
      let j = i + 1;
      while (j < reservations.length) {
        const next = reservations[j];
        const isSameDate = new Date(current.date).toDateString() === new Date(next.date).toDateString();
        // For descending order, next timeSlot should be one less than current
        const isConsecutive = next.timeSlot === (consecutiveGroup[consecutiveGroup.length - 1].timeSlot - 1);
        const haveSamePlayers = JSON.stringify(current.players.sort()) === JSON.stringify(next.players.sort());

        if (isSameDate && isConsecutive && haveSamePlayers) {
          consecutiveGroup.push(next);
          j++;
        } else {
          break;
        }
      }

      // Create a merged reservation if we have multiple consecutive slots
      if (consecutiveGroup.length > 1) {
        const firstSlot = consecutiveGroup[0]; // Highest time slot (descending)
        const lastSlot = consecutiveGroup[consecutiveGroup.length - 1]; // Lowest time slot
        const totalFee = consecutiveGroup.reduce((sum, res) => sum + res.totalFee, 0);

        const mergedReservation: Reservation = {
          ...firstSlot,
          timeSlotDisplay: this.formatTimeRange(lastSlot.timeSlot, firstSlot.timeSlot + 1),
          totalFee: totalFee,
          feePerPlayer: totalFee / firstSlot.players.length
        };

        grouped.push(mergedReservation);
      } else {
        // Single reservation, keep as is
        grouped.push(current);
      }

      i = j;
    }

    return grouped;
  }

  groupConsecutiveReservations(reservations: any[]): Reservation[] {
    // First, sort reservations by date and timeSlot in ASCENDING order
    const sorted = reservations.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.timeSlot - b.timeSlot;
    });

    const grouped: Reservation[] = [];
    let i = 0;

    while (i < sorted.length) {
      const current = sorted[i];
      const consecutiveGroup = [current];
      
      // Find consecutive reservations for the same date
      let j = i + 1;
      while (j < sorted.length) {
        const next = sorted[j];
        const isSameDate = new Date(current.date).toDateString() === new Date(next.date).toDateString();
        const isConsecutive = next.timeSlot === (consecutiveGroup[consecutiveGroup.length - 1].timeSlot + 1);
        const haveSamePlayers = JSON.stringify(current.players.sort()) === JSON.stringify(next.players.sort());
        
        if (isSameDate && isConsecutive && haveSamePlayers) {
          consecutiveGroup.push(next);
          j++;
        } else {
          break;
        }
      }

      // Create a merged reservation if we have multiple consecutive slots
      if (consecutiveGroup.length > 1) {
        const firstSlot = consecutiveGroup[0];
        const lastSlot = consecutiveGroup[consecutiveGroup.length - 1];
        const totalFee = consecutiveGroup.reduce((sum, res) => sum + res.totalFee, 0);
        
        const mergedReservation: Reservation = {
          ...firstSlot,
          timeSlotDisplay: this.formatTimeRange(firstSlot.timeSlot, lastSlot.timeSlot + 1),
          totalFee: totalFee,
          feePerPlayer: totalFee / firstSlot.players.length
        };
        
        grouped.push(mergedReservation);
      } else {
        // Single reservation, keep as is
        grouped.push(current);
      }

      i = j;
    }

    return grouped;
  }

  getDay(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  }

  /**
   * Convert 24-hour time to 12-hour AM/PM format
   */
  formatTime(hour: number): string {
    if (hour === 0) return '12AM';
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  }

  /**
   * Create time range display in AM/PM format
   */
  formatTimeRange(startHour: number, endHour: number): string {
    return `${this.formatTime(startHour)} - ${this.formatTime(endHour)}`;
  }

  /**
   * Convert all reservation time displays to AM/PM format
   */
  convertToAMPMFormat(reservations: Reservation[]): void {
    reservations.forEach(reservation => {
      if (!reservation.timeSlotDisplay || reservation.timeSlotDisplay.includes(':00')) {
        // If it's a single hour slot or military time format, convert it
        if (reservation.timeSlotDisplay && reservation.timeSlotDisplay.includes(' - ')) {
          // Handle range format like "18:00 - 20:00"
          const parts = reservation.timeSlotDisplay.split(' - ');
          const startHour = parseInt(parts[0].split(':')[0]);
          const endHour = parseInt(parts[1].split(':')[0]);
          reservation.timeSlotDisplay = this.formatTimeRange(startHour, endHour);
        } else {
          // Handle single slot format, use timeSlot property
          const endHour = reservation.timeSlot + 1;
          reservation.timeSlotDisplay = this.formatTimeRange(reservation.timeSlot, endHour);
        }
      }
    });
  }

  getDateMonth(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  getShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'primary';
      case 'pending': return 'accent';
      case 'cancelled': return 'warn';
      case 'completed': return '';
      default: return '';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid': return 'primary';
      case 'pending': return 'accent';
      case 'overdue': return 'warn';
      default: return '';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Payment Pending';
      case 'overdue': return 'Payment Overdue';
      default: return status;
    }
  }

  canEdit(reservation: Reservation): boolean {
    const reservationDate = new Date(reservation.date);
    const now = new Date();
    // Can edit if reservation is in the future and not cancelled
    return reservationDate > now && reservation.status !== 'cancelled';
  }

  canCancel(reservation: Reservation): boolean {
    return canCancelReservation(reservation);
  }

  editReservation(reservation: Reservation): void {
    // Navigate to reservations page with edit mode
    this.router.navigate(['/reservations'], { 
      queryParams: { edit: reservation._id } 
    });
  }

  cancelReservation(reservation: Reservation): void {
    this.reservationToCancel = reservation;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.reservationToCancel = null;
  }

  confirmCancelReservation(): void {
    if (!this.reservationToCancel) return;

    this.http.delete<any>(`${this.apiUrl}/reservations/${this.reservationToCancel._id}`).subscribe({
      next: (response) => {
        this.snackBar.open('Reservation cancelled successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadReservations(); // Reload the list
        this.closeCancelModal(); // Close the modal
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to cancel reservation';
        this.snackBar.open(message, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.closeCancelModal(); // Close the modal even on error
      }
    });
  }

  viewPayment(reservation: Reservation): void {
    this.router.navigate(['/payments'], { 
      queryParams: { reservation: reservation._id } 
    });
  }

  createNewReservation(): void {
    this.router.navigate(['/reservations']);
  }

  // New methods for All Reservations tab
  isPastReservation(date: Date | string): boolean {
    return new Date(date) < new Date();
  }

  getFullDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Filter out the reservation creator from players list to avoid duplication
  getFilteredPlayers(reservation: any): string[] {
    if (!reservation.players || !reservation.userId) {
      return reservation.players || [];
    }
    
    const creatorName = reservation.userId.fullName;
    return reservation.players.filter((player: string) => player !== creatorName);
  }

  getTimeUntil(date: Date | string): string {
    const now = new Date();
    const future = new Date(date);
    const diffMs = future.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  }


  isWeatherClear(weatherDescription: string): boolean {
    if (!weatherDescription) return false;
    const clearConditions = ['clear sky', 'clear', 'sunny'];
    return clearConditions.some(condition => 
      weatherDescription.toLowerCase().includes(condition)
    );
  }

  getWeatherBackgroundColor(reservation: Reservation): string {
    if (!reservation.weatherForecast?.description) {
      return ''; // Default color
    }
    
    const description = reservation.weatherForecast.description.toLowerCase();
    
    // Clear/Sunny weather - Light blue
    if (this.isWeatherClear(description)) {
      return 'rgba(173, 216, 255, 0.3)';
    }
    
    // Rainy weather - Light purple/blue
    if (description.includes('rain') || description.includes('drizzle') || description.includes('shower')) {
      return 'rgba(196, 181, 253, 0.3)'; // Light purple for rain
    }
    
    // Stormy weather - Darker gray
    if (description.includes('storm') || description.includes('thunder')) {
      return 'rgba(107, 114, 128, 0.4)'; // Darker gray for storms
    }
    
    // Foggy/Misty weather - Light yellow/gray
    if (description.includes('fog') || description.includes('mist') || description.includes('haze')) {
      return 'rgba(254, 240, 138, 0.3)'; // Light yellow for fog/mist
    }
    
    // Snow weather - Light cyan/white
    if (description.includes('snow') || description.includes('sleet')) {
      return 'rgba(224, 242, 254, 0.4)'; // Light cyan for snow
    }
    
    // Cloudy weather (default for clouds, overcast, etc.) - Light gray
    return 'rgba(156, 163, 175, 0.2)';
  }

  getWeatherBorderColor(reservation: Reservation): string {
    if (!reservation.weatherForecast?.description) {
      return '#e5e7eb'; // Default gray
    }
    
    const description = reservation.weatherForecast.description.toLowerCase();
    
    // Clear/Sunny weather - Blue
    if (this.isWeatherClear(description)) {
      return '#3b82f6';
    }
    
    // Rainy weather - Purple
    if (description.includes('rain') || description.includes('drizzle') || description.includes('shower')) {
      return '#8b5cf6'; // Purple for rain
    }
    
    // Stormy weather - Dark gray
    if (description.includes('storm') || description.includes('thunder')) {
      return '#6b7280'; // Dark gray for storms
    }
    
    // Foggy/Misty weather - Yellow
    if (description.includes('fog') || description.includes('mist') || description.includes('haze')) {
      return '#f59e0b'; // Yellow for fog/mist
    }
    
    // Snow weather - Light blue
    if (description.includes('snow') || description.includes('sleet')) {
      return '#0ea5e9'; // Light blue for snow
    }
    
    // Cloudy weather (default) - Gray
    return '#9ca3af';
  }

  getWeatherIcon(weatherIcon: string): string {
    // Map OpenWeatherMap icons to Material Icons
    const iconMap: { [key: string]: string } = {
      '01d': 'wb_sunny',        // clear sky day
      '01n': 'nights_stay',     // clear sky night
      '02d': 'partly_cloudy_day', // few clouds day
      '02n': 'partly_cloudy_night', // few clouds night
      '03d': 'cloud',           // scattered clouds
      '03n': 'cloud',           // scattered clouds
      '04d': 'cloud',           // broken clouds
      '04n': 'cloud',           // broken clouds
      '09d': 'grain',           // shower rain
      '09n': 'grain',           // shower rain
      '10d': 'rainy',           // rain day
      '10n': 'rainy',           // rain night
      '11d': 'thunderstorm',    // thunderstorm day
      '11n': 'thunderstorm',    // thunderstorm night
      '13d': 'ac_unit',         // snow day
      '13n': 'ac_unit',         // snow night
      '50d': 'foggy',           // mist day
      '50n': 'foggy'            // mist night
    };
    
    return iconMap[weatherIcon] || 'cloud';
  }

  /**
   * Add mock weather data to upcoming reservations for testing
   */
  addWeatherToUpcomingReservations(): void {
    console.log('🧪 Adding weather data to upcoming reservations...');
    
    this.upcomingReservations.forEach((reservation, index) => {
      if (!reservation.weatherForecast) {
        const weatherTypes = [
          { desc: 'sunny', icon: '01d', temp: 30, rain: 5 },
          { desc: 'partly cloudy', icon: '02d', temp: 28, rain: 15 },
          { desc: 'light rain', icon: '10d', temp: 25, rain: 80 },
          { desc: 'cloudy', icon: '03d', temp: 26, rain: 35 }
        ];
        
        const weather = weatherTypes[index % weatherTypes.length];
        reservation.weatherForecast = {
          temperature: weather.temp + Math.floor(Math.random() * 4) - 2, // ±2 degrees variation
          description: weather.desc,
          icon: weather.icon,
          rainChance: weather.rain + Math.floor(Math.random() * 20) - 10 // ±10% variation
        };
        
        // Ensure rain chance is within 0-100 range
        if (reservation.weatherForecast.rainChance < 0) reservation.weatherForecast.rainChance = 0;
        if (reservation.weatherForecast.rainChance > 100) reservation.weatherForecast.rainChance = 100;
        
        console.log(`🧪 Added weather to upcoming reservation: ${reservation.weatherForecast.temperature}°C, ${reservation.weatherForecast.rainChance}% rain`);
      }
    });
  }

  /**
   * Add mock rain chance data for testing purposes
   * This demonstrates the rain chance feature working
   */
  addMockRainChanceForTesting(): void {
    console.log('🧪 Adding mock rain chance data for testing...');
    
    // Add weather forecast with rain chance to the first few reservations for demonstration
    this.allReservations.slice(0, 3).forEach((reservation, index) => {
      if (!reservation.weatherForecast) {
        reservation.weatherForecast = {
          temperature: 28 + (index * 2),
          description: index === 0 ? 'partly cloudy' : index === 1 ? 'light rain' : 'clear sky',
          icon: index === 0 ? '02d' : index === 1 ? '10d' : '01d',
          rainChance: index === 0 ? 25 : index === 1 ? 75 : 5
        };
        console.log(`🧪 Added weather data to reservation ${reservation._id}: ${reservation.weatherForecast.rainChance}% rain`);
      } else if (reservation.weatherForecast && reservation.weatherForecast.rainChance === undefined) {
        // Add rain chance to existing weather data
        reservation.weatherForecast.rainChance = Math.floor(Math.random() * 101);
        console.log(`🧪 Added rain chance to existing weather data: ${reservation.weatherForecast.rainChance}%`);
      }
    });
  }

  /**
   * Add Homeowner's Day entries for the next 2 upcoming Wednesdays
   */
  addHomeownerDayEntries(): void {
    const homeownerEntries = this.generateHomeownerDayEntries();
    
    // Add entries to the beginning of the list
    this.allReservations = [...homeownerEntries, ...this.allReservations];

    // Sort by date AND timeSlot to maintain chronological order
    this.allReservations.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.timeSlot - b.timeSlot;
    });

    console.log(`✅ Added ${homeownerEntries.length} Homeowner's Day entries`);
  }

  /**
   * Generate Homeowner's Day entries for the next 2 upcoming Wednesdays
   */
  generateHomeownerDayEntries(): Reservation[] {
    const entries: Reservation[] = [];
    const now = new Date();
    let foundWednesdays = 0;
    
    // Look for next 2 Wednesdays within the next 30 days
    for (let i = 0; i < 30 && foundWednesdays < 2; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      
      // Check if this date is a Wednesday (day 3) and is in the future
      if (checkDate.getDay() === 3 && checkDate >= now) {
        // Generate weather forecast for the Wednesday evening
        const weatherTypes = [
          { desc: 'sunny', icon: '01d', temp: 28, rain: 10 },
          { desc: 'partly cloudy', icon: '02d', temp: 26, rain: 20 },
          { desc: 'cloudy', icon: '03d', temp: 25, rain: 30 },
          { desc: 'clear sky', icon: '01d', temp: 29, rain: 5 }
        ];
        
        const weather = weatherTypes[foundWednesdays % weatherTypes.length];
        
        const entry: Reservation = {
          _id: `homeowner-${checkDate.toISOString().split('T')[0]}`, // Unique ID
          date: checkDate,
          timeSlot: 18, // 6 PM
          timeSlotDisplay: '6:00 PM - 8:00 PM',
          players: ["Homeowner's Day"],
          status: 'confirmed',
          paymentStatus: 'paid',
          totalFee: 0,
          feePerPlayer: 0,
          createdAt: now,
          updatedAt: now,
          isHomeownerDay: true, // Special flag
          weatherForecast: {
            temperature: weather.temp + Math.floor(Math.random() * 4) - 2, // ±2 degrees variation
            description: weather.desc,
            icon: weather.icon,
            rainChance: weather.rain + Math.floor(Math.random() * 10) - 5 // ±5% variation
          }
        };
        
        entries.push(entry);
        foundWednesdays++;
        
        console.log(`📅 Generated Homeowner's Day entry for: ${checkDate.toDateString()}`);
      }
    }
    
    return entries;
  }

}