import { Component, OnInit } from '@angular/core';
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
        <mat-tab-group class="reservations-tabs" (selectedTabChange)="onTabChange($event)">
          <!-- Upcoming Reservations -->
          <mat-tab label="Upcoming" [disabled]="loading">
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
                      </span>
                    </div>
                    <div class="card-actions">
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
          <mat-tab label="History" [disabled]="loading">
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
                      <mat-chip class="status-chip" [ngClass]="'status-' + reservation.status">
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
          
          <!-- All Reservations -->
          <mat-tab label="All Reservations" [disabled]="loading">
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
                     [style.border-left-color]="getWeatherBorderColor(reservation)">
                  <div class="card-left">
                    <div class="date-badge" [ngClass]="isPastReservation(reservation.date) ? 'past' : ''">
                      <span class="date-day">{{getDay(reservation.date)}}</span>
                      <span class="date-info">{{getShortDate(reservation.date)}}</span>
                    </div>
                    <div class="reservation-main">
                      <div class="time-slot">{{reservation.timeSlotDisplay}}</div>
                      <div class="user-info" *ngIf="reservation.userId">
                        <mat-icon class="inline-icon">person</mat-icon>
                        <span class="user-text">{{reservation.userId.fullName}} ({{reservation.userId.username}})</span>
                      </div>
                      <div class="players-info">
                        <mat-icon class="inline-icon">people</mat-icon>
                        <span class="players-text">{{reservation.players.join(', ')}}</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="status-chips">
                      <mat-chip class="status-chip" [ngClass]="'status-' + reservation.status">
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
export class MyReservationsComponent implements OnInit {
  upcomingReservations: Reservation[] = [];
  pastReservations: Reservation[] = [];
  allReservations: Reservation[] = [];
  loading = true;
  currentTab = 0;
  
  // Cancel modal state
  showCancelModal = false;
  reservationToCancel: Reservation | null = null;
  
  private apiUrl = 'http://localhost:3000/api';

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
    
    // Test backend connectivity first
    this.testBackendConnectivity();
  }

  private testBackendConnectivity(): void {
    console.log('🔌 Testing backend connectivity...');
    
    // Try /health endpoint first (without /api prefix)
    this.http.get<any>('http://localhost:3000/health')
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
        
        console.log('📊 Personal Reservations loaded:');
        console.log('- Upcoming:', this.upcomingReservations.length);
        console.log('- Past:', this.pastReservations.length);
        
        this.loading = false;
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
    // Load all reservations when switching to "All Reservations" tab (index 2)
    if (event.index === 2) {
      console.log('📋 Loading All Reservations tab, current length:', this.allReservations.length);
      this.loadAllReservations();
    }
  }

  loadAllReservations(): void {
    console.log('Loading all reservations from all users...');
    this.loading = true;
    
    // Use the general reservations endpoint with showAll=true to get all reservations
    const timestamp = new Date().getTime();
    this.http.get<any>(`${this.apiUrl}/reservations?showAll=true&_t=${timestamp}`).subscribe({
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
        
        // Filter out cancelled reservations
        const activeReservations = reservations.filter((r: any) => r.status !== 'cancelled');
        console.log('🔍 Active reservations before grouping:', activeReservations.length);
        console.log('🔍 Active reservations details:', activeReservations.map(r => ({
          id: r._id,
          user: r.userId?.fullName,
          date: r.date,
          timeSlot: r.timeSlot,
          players: r.players
        })));
        
        this.allReservations = this.groupConsecutiveReservations(activeReservations);
        console.log('🔍 After grouping:', this.allReservations.length);
        
        // Add mock rain chance data to a few reservations for testing
        this.addMockRainChanceForTesting();
        
        console.log('📊 All Reservations loaded:');
        console.log('- Total from all users (excluding cancelled):', this.allReservations.length);
        console.log('- Cancelled reservations filtered out:', reservations.length - activeReservations.length);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading all reservations:', error);
        this.loading = false;
        this.snackBar.open('Failed to load all reservations', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  groupConsecutiveReservations(reservations: any[]): Reservation[] {
    // First, sort reservations by date and timeSlot
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
          timeSlotDisplay: `${firstSlot.timeSlot}:00 - ${lastSlot.timeSlot + 1}:00`,
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
    const reservationDate = new Date(reservation.date);
    const now = new Date();
    // Can cancel if reservation is in the future and not already cancelled
    return reservationDate > now && reservation.status !== 'cancelled';
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

}