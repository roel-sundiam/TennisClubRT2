import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

interface PlayerRanking {
  _id: string;
  username: string;
  fullName: string;
  rank: number;
}

interface TournamentStats {
  totalMatches: number;
  matchesByTier: Record<string, number>;
  totalEvents: number;
  activeMembers: number;
}

@Component({
  selector: 'app-rankings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule
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
                  <mat-icon>emoji_events</mat-icon>
                  Player Rankings
                </h1>
                <p class="page-subtitle">Tennis tournament rankings and statistics</p>
              </div>
            </div>
            <div class="header-actions">
              <button mat-icon-button (click)="refreshRankings()" [disabled]="loading" class="refresh-button" 
                      [class.spinning]="loading" title="Refresh rankings">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Tournament Stats Cards -->
        <div class="stats-section" *ngIf="tournamentStats">
          <h2 class="section-title">
            <mat-icon>analytics</mat-icon>
            Tournament Statistics
          </h2>
          
          <div class="stats-grid">
            <div class="stat-card players-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>people</mat-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ tournamentStats.activeMembers }}</div>
                  <div class="stat-label">Active Members</div>
                </div>
              </div>
            </div>
            
            <div class="stat-card matches-card">
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>event</mat-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ tournamentStats.totalEvents }}</div>
                  <div class="stat-label">Open Play Events</div>
                </div>
              </div>
            </div>
            
            <div class="stat-card tiers-card">
              <div class="stat-content">
                <div class="stat-breakdown">
                  <div class="tier-item">
                    <div class="tier-chip tier-100">100</div>
                    <span class="tier-count">{{ tournamentStats.matchesByTier['100'] || 0 }}</span>
                  </div>
                  <div class="tier-item">
                    <div class="tier-chip tier-250">250</div>
                    <span class="tier-count">{{ tournamentStats.matchesByTier['250'] || 0 }}</span>
                  </div>
                  <div class="tier-item">
                    <div class="tier-chip tier-500">500</div>
                    <span class="tier-count">{{ tournamentStats.matchesByTier['500'] || 0 }}</span>
                  </div>
                </div>
                <div class="stat-label">Series Matches</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="state-card loading-card">
          <div class="state-content">
            <mat-spinner diameter="48"></mat-spinner>
            <h3>Loading rankings...</h3>
            <p>Please wait while we fetch the latest tournament data</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="state-card error-card">
          <div class="state-content">
            <mat-icon class="state-icon error-icon">error_outline</mat-icon>
            <h3>Unable to Load Rankings</h3>
            <p>{{ error }}</p>
            <button mat-raised-button (click)="loadRankings()" class="retry-button">
              <mat-icon>refresh</mat-icon>
              Try Again
            </button>
          </div>
        </div>

        <!-- No Data State -->
        <div *ngIf="!loading && !error && rankings.length === 0" class="state-card no-data-card">
          <div class="state-content">
            <mat-icon class="state-icon">emoji_events</mat-icon>
            <h3>No Rankings Yet</h3>
            <p>Rankings will appear once players start participating in Open Play matches.</p>
          </div>
        </div>

        <!-- Rankings Table -->
        <div *ngIf="!loading && !error && rankings.length > 0" class="rankings-section">
          <div class="rankings-card">
            <div class="card-header">
              <div class="header-content">
                <div class="header-info">
                  <h2 class="card-title">Current Rankings</h2>
                  <p class="card-subtitle">Member rankings based on participation in Open Play events</p>
                </div>
                <div class="header-chips">
                  <div class="legend-chip tier-100">100</div>
                  <div class="legend-chip tier-250">250</div>
                  <div class="legend-chip tier-500">500</div>
                </div>
              </div>
            </div>
            
            <div class="card-content">
          <div class="rankings-table">
            <div class="table-header">
              <div class="rank-col">Rank</div>
              <div class="player-col">Player</div>
            </div>

            <div 
              *ngFor="let player of rankings; trackBy: trackPlayer"
              class="table-row"
              [class.current-user]="player._id === currentUserId"
              [class.top-3]="player.rank <= 3">
              
              <div class="rank-col">
                <div class="rank-display" [class]="'rank-' + player.rank">
                  <mat-icon *ngIf="player.rank === 1" class="trophy gold">emoji_events</mat-icon>
                  <mat-icon *ngIf="player.rank === 2" class="trophy silver">emoji_events</mat-icon>
                  <mat-icon *ngIf="player.rank === 3" class="trophy bronze">emoji_events</mat-icon>
                  <span *ngIf="player.rank > 3" class="rank-number">#{{ player.rank }}</span>
                </div>
              </div>

              <div class="player-col">
                <div class="player-info">
                  <div class="player-name">{{ player.fullName }}</div>
                  <div class="player-username">@{{ player.username }}</div>
                </div>
              </div>

            </div>
          </div>

              <div *ngIf="rankings.length >= currentLimit" class="load-more-section">
                <button mat-stroked-button (click)="loadMoreRankings()" [disabled]="loadingMore" class="load-more-button">
                  <mat-icon *ngIf="!loadingMore">expand_more</mat-icon>
                  <mat-spinner *ngIf="loadingMore" diameter="20"></mat-spinner>
                  {{ loadingMore ? 'Loading...' : 'Show More Players' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- My Stats Card -->
        <div *ngIf="currentUserStats && !loading" class="my-stats-section">
          <div class="my-stats-card">
            <div class="card-header">
              <div class="header-icon">
                <mat-icon>account_circle</mat-icon>
              </div>
              <div class="header-text">
                <h2 class="card-title">Your Statistics</h2>
                <p class="card-subtitle">Personal performance overview</p>
              </div>
            </div>
            
            <div class="card-content">
          <div class="my-stats-grid">
            <div class="my-stat">
              <mat-icon class="stat-icon">trophy</mat-icon>
              <div class="my-stat-value">{{ currentUserStats.rank || 'Unranked' }}</div>
              <div class="my-stat-label">Rank</div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="no-stats-message">
            <mat-icon>sports_tennis</mat-icon>
            <p>Rankings are based on participation in Open Play events. Join an event to see your ranking!</p>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './rankings.component.scss'
})
export class RankingsComponent implements OnInit {
  rankings: PlayerRanking[] = [];
  tournamentStats: TournamentStats | null = null;
  currentUserStats: any = null;
  loading = true;
  loadingMore = false;
  error: string | null = null;
  currentLimit = 50;
  currentUserId: string | null = null;
  
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.currentUserId = this.authService.currentUser?._id || null;
  }

  ngOnInit(): void {
    this.loadRankings();
    this.loadTournamentStats();
    this.loadCurrentUserStats();
  }

  loadRankings(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<any>(`${this.apiUrl}/seeding/rankings?limit=${this.currentLimit}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.rankings = response.data.rankings || [];
        } else {
          this.error = response.message || 'Failed to load rankings';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rankings:', error);
        this.error = error.error?.message || 'Failed to load rankings';
        this.loading = false;
      }
    });
  }

  loadTournamentStats(): void {
    this.http.get<any>(`${this.apiUrl}/seeding/tournament-stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.tournamentStats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading tournament stats:', error);
      }
    });
  }

  loadCurrentUserStats(): void {
    if (!this.currentUserId) return;
    
    this.http.get<any>(`${this.apiUrl}/seeding/my-stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentUserStats = response.data;
        }
      },
      error: (error) => {
        console.log('Current user has no seeding stats yet (no matches played)');
        // Create default stats for display
        if (this.authService.currentUser) {
          this.currentUserStats = {
            user: {
              ...this.authService.currentUser
            },
            rank: null,
            totalPlayers: this.rankings.length
          };
        }
      }
    });
  }

  loadMoreRankings(): void {
    this.loadingMore = true;
    this.currentLimit += 50;
    
    this.http.get<any>(`${this.apiUrl}/seeding/rankings?limit=${this.currentLimit}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.rankings = response.data.rankings || [];
        }
        this.loadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more rankings:', error);
        this.loadingMore = false;
      }
    });
  }

  refreshRankings(): void {
    this.loadRankings();
    this.loadTournamentStats();
    this.loadCurrentUserStats();
  }

  trackPlayer(index: number, player: PlayerRanking): string {
    return player._id;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

}