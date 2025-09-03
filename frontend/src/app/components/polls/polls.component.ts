import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface Poll {
  _id: string;
  title: string;
  description: string;
  options: PollOption[];
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  endDate?: string;
  metadata?: {
    category?: string;
    allowMultipleVotes?: boolean;
    isAnonymous?: boolean;
  };
  openPlayEvent?: {
    eventDate: Date;
    startTime: number;
    endTime: number;
    maxPlayers: number;
    playerFee: number;
    confirmedPlayers: string[];
    matchesGenerated?: boolean;
    matches?: any[];
    tournamentTier?: string;
  };
}

interface PollOption {
  _id: string;
  text: string;
  votes: number;
  voters: string[];
}

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-content">
      <!-- Page Header -->
      <div class="polls-header">
        <div class="header-icon">
          <mat-icon>how_to_vote</mat-icon>
        </div>
        <div class="header-content">
          <h1 class="page-title">Poll & Event Management</h1>
          <p class="page-subtitle">Manage club polls and Open Play events</p>
        </div>
        <button mat-raised-button class="refresh-btn" (click)="loadPolls()" color="primary">
          <mat-icon>refresh</mat-icon>
          <span>Refresh</span>
        </button>
      </div>

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon club-polls">
            <mat-icon>ballot</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{getStatCount('club_polls')}}</div>
            <div class="stat-label">Club Polls</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon open-play">
            <mat-icon>groups</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{activePolls.length}}</div>
            <div class="stat-label">Open Play Events</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon create-open">
            <mat-icon>add_circle</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{getStatCount('create_open')}}</div>
            <div class="stat-label">Create Open Play</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon match-mgmt">
            <mat-icon>sports_tennis</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{getStatCount('match_mgmt')}}</div>
            <div class="stat-label">Match Management</div>
          </div>
        </div>
        
        <div class="stat-card" *ngIf="isAdmin">
          <div class="stat-icon record-results">
            <mat-icon>assessment</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{getStatCount('record_results')}}</div>
            <div class="stat-label">Record Results</div>
          </div>
        </div>
      </div>

      <mat-tab-group class="polls-tabs">
        <!-- Active Polls Tab -->
        <mat-tab label="Active Polls">
          <div class="tab-content">
            <div *ngIf="loading" class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Loading polls...</p>
            </div>

            <div *ngIf="!loading && activePolls.length === 0" class="no-polls">
              <mat-icon>ballot</mat-icon>
              <h3>No Active Polls</h3>
              <p>There are currently no polls available for voting.</p>
            </div>

            <div *ngFor="let poll of activePolls" class="poll-card-container">
              <mat-card class="poll-card" [ngClass]="getPollClass(poll)">
                <!-- Professional Header -->
                <div class="poll-card-header">
                  <div class="header-top">
                    <div class="event-icon">
                      <mat-icon>sports_tennis</mat-icon>
                    </div>
                    <div class="header-content">
                      <h2 class="event-title">{{poll.title}}</h2>
                      <p class="event-description">{{poll.description}}</p>
                    </div>
                    <div class="status-badges">
                      <span class="status-badge active">{{poll.status.toUpperCase()}}</span>
                      <span *ngIf="poll.metadata?.category" class="category-badge">
                        {{getCategoryLabel(poll.metadata.category)}}
                      </span>
                    </div>
                  </div>
                  <div class="deadline-banner" *ngIf="poll.endDate">
                    <mat-icon>schedule</mat-icon>
                    <span>Registration closes: {{formatDate(poll.endDate)}}</span>
                  </div>
                </div>

                <!-- Professional Event Details -->
                <div *ngIf="poll.openPlayEvent" class="event-details-section">
                  <div class="details-grid">
                    <div class="detail-card">
                      <div class="detail-icon date-icon">
                        <mat-icon>event</mat-icon>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Event Date</span>
                        <span class="detail-value">{{formatEventDate(poll.openPlayEvent.eventDate)}}</span>
                      </div>
                    </div>
                    
                    <div class="detail-card">
                      <div class="detail-icon time-icon">
                        <mat-icon>schedule</mat-icon>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Time Slot</span>
                        <span class="detail-value">{{formatTimeRange(poll.openPlayEvent.startTime, poll.openPlayEvent.endTime)}}</span>
                      </div>
                    </div>
                    
                    <div class="detail-card">
                      <div class="detail-icon players-icon">
                        <mat-icon>groups</mat-icon>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Players</span>
                        <span class="detail-value">
                          <span class="current-players">{{poll.openPlayEvent.confirmedPlayers.length}}</span>
                          <span class="separator">/</span>
                          <span class="max-players">{{poll.openPlayEvent.maxPlayers}}</span>
                        </span>
                        <div class="progress-bar">
                          <div class="progress-fill" 
                               [style.width.%]="(poll.openPlayEvent.confirmedPlayers.length / poll.openPlayEvent.maxPlayers) * 100">
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="detail-card">
                      <div class="detail-icon price-icon">
                        <mat-icon>payments</mat-icon>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Entry Fee</span>
                        <span class="detail-value price">₱{{poll.openPlayEvent.playerFee}}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Entry Fee Information -->
                <div *ngIf="poll.openPlayEvent" class="fee-info-section">
                  <div class="info-header">
                    <mat-icon>info</mat-icon>
                    <span class="info-title">What's Included in Your Entry Fee</span>
                  </div>
                  <div class="fee-details">
                    <div class="included-items">
                      <div class="item">
                        <mat-icon>sports_tennis</mat-icon>
                        <span>Court rental fee</span>
                      </div>
                      <div class="item">
                        <mat-icon>person</mat-icon>
                        <span>Ball boy service</span>
                      </div>
                      <div class="item">
                        <mat-icon>sports</mat-icon>
                        <span>Fresh tennis balls</span>
                      </div>
                      <div class="item">
                        <mat-icon>lightbulb</mat-icon>
                        <span>Court lighting</span>
                      </div>
                    </div>
                  </div>
                  <div class="ranking-points-info">
                    <div class="points-header">
                      <mat-icon>emoji_events</mat-icon>
                      <span class="points-title">Ranking Points</span>
                    </div>
                    <div class="points-details">
                      <div class="points-breakdown">
                        <div class="tier-info">
                          <span class="tier-label">{{getTierLabel(poll.openPlayEvent.tournamentTier || '100')}} Tournament</span>
                        </div>
                        <div class="points-grid">
                          <div class="points-item winner">
                            <mat-icon>emoji_events</mat-icon>
                            <div class="points-content">
                              <span class="points-label">Winner</span>
                              <span class="points-value">{{getWinnerPoints(poll.openPlayEvent.tournamentTier || '100')}} pts</span>
                            </div>
                          </div>
                          <div class="points-item runner-up">
                            <mat-icon>military_tech</mat-icon>
                            <div class="points-content">
                              <span class="points-label">Runner-up</span>
                              <span class="points-value">{{getRunnerUpPoints(poll.openPlayEvent.tournamentTier || '100')}} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Regular Poll Content -->
                <mat-card-content *ngIf="!poll.openPlayEvent">
                  <div class="poll-options">
                    <div *ngFor="let option of poll.options" class="poll-option">
                      <div class="option-text">{{option.text}}</div>
                      <div class="option-votes">{{option.votes}} vote{{option.votes !== 1 ? 's' : ''}}</div>
                    </div>
                  </div>
                </mat-card-content>

                <!-- Professional Voting Interface -->
                <div class="voting-section">
                  <!-- Open Play Event Voting -->
                  <div *ngIf="poll.openPlayEvent" class="open-play-voting">
                    <div class="voting-header">
                      <div class="participation-question">
                        <mat-icon class="question-icon">help_outline</mat-icon>
                        <h3>Will you join this Open Play event?</h3>
                      </div>
                      
                      <div *ngIf="hasUserVoted(poll)" class="current-status">
                        <div class="status-indicator" [class]="getUserVote(poll) === 'Yes' ? 'confirmed' : 'declined'">
                          <mat-icon>{{getUserVote(poll) === 'Yes' ? 'check_circle' : 'cancel'}}</mat-icon>
                          <span class="status-text">
                            {{getUserVote(poll) === 'Yes' ? 'You are participating!' : 'You are not participating'}}
                          </span>
                        </div>
                        <p class="change-notice">
                          <mat-icon>info</mat-icon>
                          You can change your decision anytime before registration closes
                        </p>
                      </div>
                      
                      <div *ngIf="!hasUserVoted(poll)" class="participation-prompt">
                        <p>Select your participation status to help us organize the event</p>
                      </div>
                    </div>
                    
                    <div class="vote-options-professional">
                      <div class="voting-buttons">
                        <button *ngFor="let option of poll.options" 
                                mat-raised-button 
                                [class]="getVoteButtonClass(poll, option)"
                                (click)="vote(poll, option)"
                                class="professional-vote-button">
                          <div class="button-layout">
                            <div class="button-icon">
                              <mat-icon>{{getVoteButtonIcon(option.text)}}</mat-icon>
                            </div>
                            <div class="button-text">
                              <span class="choice-text">{{option.text}}</span>
                              <span class="choice-subtitle">
                                {{option.text === 'Yes' ? 'I will be there' : 'Cannot make it'}}
                              </span>
                            </div>
                            <div class="vote-stats">
                              <span class="vote-count">{{option.votes}}</span>
                              <span class="vote-label">{{option.votes === 1 ? 'player' : 'players'}}</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Regular Poll Voting -->
                  <div *ngIf="!poll.openPlayEvent" class="regular-poll-voting">
                    <div class="vote-status" *ngIf="hasUserVoted(poll)">
                      <mat-icon class="voted-icon">check_circle</mat-icon>
                      <span>You voted: <strong>{{getUserVote(poll)}}</strong></span>
                      <span *ngIf="poll.metadata?.allowMultipleVotes" class="change-hint">You can change your vote</span>
                    </div>
                    
                    <div class="action-buttons">
                      <button *ngFor="let option of poll.options" 
                              mat-raised-button 
                              [color]="hasUserVotedFor(poll, option) ? 'primary' : ''"
                              [disabled]="hasUserVoted(poll) && !poll.metadata?.allowMultipleVotes"
                              (click)="vote(poll, option)"
                              class="vote-button">
                        <mat-icon *ngIf="hasUserVotedFor(poll, option)">check</mat-icon>
                        {{option.text}}
                        <span class="vote-count-small">({{option.votes}})</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Confirmed Players List for Open Play -->
                <div *ngIf="poll.openPlayEvent && getConfirmedPlayers(poll).length > 0" class="confirmed-players-section">
                  <div class="players-header">
                    <mat-icon>group</mat-icon>
                    <h3>Confirmed Players ({{getConfirmedPlayers(poll).length}})</h3>
                  </div>
                  <div class="players-list">
                    <div *ngFor="let playerName of getConfirmedPlayers(poll)" class="player-chip">
                      <mat-icon>person</mat-icon>
                      <span>{{playerName}}</span>
                    </div>
                  </div>
                  <div class="players-summary" *ngIf="getConfirmedPlayers(poll).length < poll.openPlayEvent.maxPlayers">
                    <mat-icon>info_outline</mat-icon>
                    <span>{{poll.openPlayEvent.maxPlayers - getConfirmedPlayers(poll).length}} more players needed</span>
                  </div>
                  <div class="players-full" *ngIf="getConfirmedPlayers(poll).length >= poll.openPlayEvent.maxPlayers">
                    <mat-icon>check_circle</mat-icon>
                    <span>Event is full! No more spots available.</span>
                  </div>
                </div>

                <!-- Doubles Tournament Match Schedule -->
                <mat-card-content *ngIf="poll.openPlayEvent?.matchesGenerated && poll.openPlayEvent?.matches" class="matches-content">
                  <h4>
                    <mat-icon>sports_tennis</mat-icon>
                    Doubles Tournament Schedule - Court 1
                  </h4>
                  <div class="matches-info">
                    <p class="matches-description">
                      <mat-icon>info</mat-icon>
                      {{poll.openPlayEvent.matches.length}} doubles matches with optimized rotation. Each player plays maximum 2 matches.
                    </p>
                    <div class="rotation-stats">
                      <mat-icon>rotate_right</mat-icon>
                      <span class="stats-text">
                        Smart rotation ensures fair play distribution for all {{getConfirmedPlayers(poll).length}} players
                      </span>
                    </div>
                  </div>
                  <div class="doubles-matches">
                    <div *ngFor="let match of poll.openPlayEvent.matches" class="doubles-match-card" [ngClass]="getMatchStatusClass(match)">
                      <div class="match-header">
                        <span class="match-number">Match {{match.matchNumber}}</span>
                        <span class="match-court">Court {{match.court}}</span>
                        <span class="match-status" [ngClass]="'status-' + match.status">
                          <mat-icon>{{getMatchStatusIcon(match.status)}}</mat-icon>
                          {{getMatchStatusText(match.status)}}
                        </span>
                      </div>
                      
                      <!-- Match Result Section -->
                      <div *ngIf="match.status === 'completed' && match.score" class="match-result">
                        <div class="result-header">
                          <mat-icon class="trophy-icon">emoji_events</mat-icon>
                          <span class="result-text">Match Result</span>
                        </div>
                        <div class="score-display">
                          <span class="score">{{match.score}}</span>
                          <span class="winner-announcement" *ngIf="match.winningTeam">
                            Team {{match.winningTeam}} Wins!
                          </span>
                        </div>
                      </div>
                      
                      <div class="match-teams">
                        <div class="team team-1" [ngClass]="{'winning-team': match.winningTeam === 1}">
                          <div class="team-header">
                            <mat-icon>group</mat-icon>
                            <span class="team-label">Team 1</span>
                            <mat-icon *ngIf="match.winningTeam === 1" class="winner-crown">emoji_events</mat-icon>
                          </div>
                          <div class="team-players">
                            <span class="player-name">{{ getPlayerDisplayName(match.players[0]) }}</span>
                            <span class="player-divider">&</span>
                            <span class="player-name">{{ getPlayerDisplayName(match.players[1]) }}</span>
                          </div>
                        </div>
                        
                        <div class="vs-section">
                          <div class="vs-circle" [ngClass]="{'match-completed': match.status === 'completed'}">
                            <span class="vs-text" *ngIf="match.status !== 'completed'">VS</span>
                            <mat-icon *ngIf="match.status === 'completed'" class="completed-icon">check_circle</mat-icon>
                          </div>
                        </div>
                        
                        <div class="team team-2" [ngClass]="{'winning-team': match.winningTeam === 2}">
                          <div class="team-header">
                            <mat-icon>group</mat-icon>
                            <span class="team-label">Team 2</span>
                            <mat-icon *ngIf="match.winningTeam === 2" class="winner-crown">emoji_events</mat-icon>
                          </div>
                          <div class="team-players">
                            <span class="player-name">{{ getPlayerDisplayName(match.players[2]) }}</span>
                            <span class="player-divider">&</span>
                            <span class="player-name">{{ getPlayerDisplayName(match.players[3]) }}</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Show players sitting out this match -->
                      <div class="sitting-out" *ngIf="getPlayersNotInMatch(poll, match).length > 0">
                        <mat-icon class="bench-icon">airline_seat_recline_normal</mat-icon>
                        <span class="sitting-label">Sitting out:</span>
                        <div class="sitting-players">
                          <span *ngFor="let playerName of getPlayersNotInMatch(poll, match); let last = last" 
                                class="sitting-player">
                            {{playerName}}<span *ngIf="!last">, </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Match rotation summary -->
                  <div class="rotation-summary">
                    <div class="summary-header">
                      <mat-icon>assessment</mat-icon>
                      <span class="summary-title">Player Match Count</span>
                    </div>
                    <div class="player-stats">
                      <div *ngFor="let stat of getPlayerMatchStats(poll)" class="player-stat">
                        <span class="player-name">{{stat.playerName}}</span>
                        <div class="match-count">
                          <mat-icon *ngFor="let i of getRange(stat.matchCount)" class="match-dot">sports_tennis</mat-icon>
                          <span class="count-text">{{stat.matchCount}} match{{stat.matchCount !== 1 ? 'es' : ''}}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Closed Polls Tab -->
        <mat-tab label="Past Polls">
          <div class="tab-content">
            <div *ngIf="!loading && closedPolls.length === 0" class="no-polls">
              <mat-icon>history</mat-icon>
              <h3>No Past Polls</h3>
              <p>Past polls and events will appear here.</p>
            </div>

            <div *ngFor="let poll of closedPolls" class="poll-card-container">
              <mat-card class="poll-card closed-poll">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="closed-icon">
                    {{getPollIcon(poll)}}
                  </mat-icon>
                  <mat-card-title>{{poll.title}}</mat-card-title>
                  <mat-card-subtitle>
                    {{poll.description}}
                    <div class="poll-meta">
                      <mat-chip-set>
                        <mat-chip class="closed-status">CLOSED</mat-chip>
                        <mat-chip *ngIf="poll.metadata?.category" class="category-chip">
                          {{getCategoryLabel(poll.metadata.category)}}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                  </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div class="poll-results">
                    <div *ngFor="let option of poll.options" class="result-option">
                      <div class="option-header">
                        <span class="option-text">{{option.text}}</span>
                        <span class="option-percentage">{{getVotePercentage(poll, option)}}%</span>
                      </div>
                      <div class="vote-bar">
                        <div class="vote-fill" [style.width.%]="getVotePercentage(poll, option)"></div>
                      </div>
                      <div class="vote-count">{{option.votes}} vote{{option.votes !== 1 ? 's' : ''}}</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrl: './polls.component.scss'
})
export class PollsComponent implements OnInit, OnDestroy {
  activePolls: Poll[] = [];
  closedPolls: Poll[] = [];
  loading = true;
  members: any[] = [];
  isAdmin = false;
  private subscription = new Subscription();
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check admin status
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    });
    
    this.loadMembers();
    this.loadPolls();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMembers(): void {
    this.http.get<any>(`${this.apiUrl}/members?limit=100&includeAll=true`).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.members = response.data;
          console.log('🔍 Polls: Loaded', this.members.length, 'members for player name resolution');
        }
      },
      error: (error) => {
        console.error('Error loading members:', error);
      }
    });
  }

  loadPolls(): void {
    this.loading = true;
    
    const activePolls$ = this.http.get<any>(`${this.apiUrl}/polls/active`);
    const allPolls$ = this.http.get<any>(`${this.apiUrl}/polls`);
    
    this.subscription.add(
      activePolls$.subscribe({
        next: async (response) => {
          this.activePolls = response.data || [];
          // Resolve player names for open play events
          await this.resolvePlayerNames(this.activePolls);
        },
        error: (error) => {
          console.error('Error loading active polls:', error);
          this.showMessage('Error loading active polls', 'error');
        }
      })
    );
    
    this.subscription.add(
      allPolls$.subscribe({
        next: async (response) => {
          const allPolls = response.data || [];
          this.closedPolls = allPolls.filter((poll: Poll) => poll.status === 'closed');
          await this.resolvePlayerNames(this.closedPolls);
          this.loading = false;
          console.log('All polls loaded:', allPolls);
        },
        error: (error) => {
          console.error('Error loading polls:', error);
          this.loading = false;
          this.showMessage('Error loading polls', 'error');
        }
      })
    );
  }

  private async resolvePlayerNames(polls: Poll[]): Promise<void> {
    for (const poll of polls) {
      if (poll.openPlayEvent?.matches) {
        for (const match of poll.openPlayEvent.matches) {
          if (match.players) {
            for (let i = 0; i < match.players.length; i++) {
              const player = match.players[i];
              if (typeof player === 'string') {
                // Player is an ID, try to resolve the name
                try {
                  const userResponse = await this.http.get<any>(`${this.apiUrl}/members/${player}`).toPromise();
                  if (userResponse.success && userResponse.data) {
                    match.players[i] = {
                      _id: player,
                      username: userResponse.data.username,
                      fullName: userResponse.data.fullName
                    };
                  }
                } catch (error) {
                  console.warn(`Could not resolve player ${player}:`, error);
                  // Keep as string ID, the getPlayerDisplayName method will handle it
                }
              }
            }
          }
        }
      }
    }
  }

  vote(poll: Poll, option: PollOption): void {
    // Allow vote changes for Open Play events or polls that explicitly allow multiple votes
    const canChangeVote = poll.openPlayEvent || poll.metadata?.allowMultipleVotes;
    
    if (this.hasUserVoted(poll) && !canChangeVote) {
      this.showMessage('You have already voted on this poll', 'warning');
      return;
    }

    const voteData = {
      optionIds: [option._id]
    };


    // Show different messages for vote changes vs new votes
    const isVoteChange = this.hasUserVoted(poll);
    const actionText = isVoteChange ? 'Vote updated' : 'Vote recorded';
    const successMessage = isVoteChange ? `${actionText} to "${option.text}"!` : `${actionText} successfully!`;

    this.http.post<any>(`${this.apiUrl}/polls/${poll._id}/vote`, voteData).subscribe({
      next: (response) => {
        this.showMessage(successMessage, 'success');
        this.loadPolls(); // Reload to show updated results
      },
      error: (error) => {
        console.error('Error voting:', error);
        this.showMessage(error.error?.message || 'Error recording vote', 'error');
      }
    });
  }

  hasUserVoted(poll: Poll): boolean {
    const userId = this.authService.currentUser?._id;
    if (!userId) return false;
    
    return poll.options.some(option => option.voters.includes(userId));
  }

  hasUserVotedFor(poll: Poll, option: PollOption): boolean {
    const userId = this.authService.currentUser?._id;
    if (!userId) return false;
    
    return option.voters.includes(userId);
  }

  getUserVote(poll: Poll): string {
    const userId = this.authService.currentUser?._id;
    if (!userId) return '';
    
    const votedOption = poll.options.find(option => option.voters.includes(userId));
    return votedOption?.text || '';
  }

  getPollClass(poll: Poll): string {
    if (poll.metadata?.category === 'open_play') {
      return 'open-play-poll';
    }
    return 'regular-poll';
  }

  getPollIcon(poll: Poll): string {
    if (poll.metadata?.category === 'open_play') {
      return 'groups';
    }
    return 'how_to_vote';
  }

  getPollIconClass(poll: Poll): string {
    if (poll.metadata?.category === 'open_play') {
      return 'open-play-icon';
    }
    return 'regular-icon';
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'open_play': 'Open Play Event',
      'club_policy': 'Club Policy',
      'facility': 'Facility',
      'general': 'General'
    };
    return labels[category] || category;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatEventDate(eventDate: Date): string {
    return new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTimeRange(startTime: number, endTime: number): string {
    const formatHour = (hour: number) => {
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    };
    
    return `${formatHour(startTime)} - ${formatHour(endTime)}`;
  }

  getVotePercentage(poll: Poll, option: PollOption): number {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    if (totalVotes === 0) return 0;
    return Math.round((option.votes / totalVotes) * 100);
  }

  getVoteButtonClass(poll: Poll, option: PollOption): string {
    const baseClasses = ['vote-option-button'];
    const userVotedFor = this.hasUserVotedFor(poll, option);
    
    if (userVotedFor) {
      baseClasses.push(option.text === 'Yes' ? 'voted-yes' : 'voted-no');
    } else {
      baseClasses.push(option.text === 'Yes' ? 'option-yes' : 'option-no');
    }
    
    return baseClasses.join(' ');
  }

  getVoteButtonIcon(optionText: string): string {
    switch (optionText.toLowerCase()) {
      case 'yes':
        return 'thumb_up';
      case 'no':
        return 'thumb_down';
      default:
        return 'how_to_vote';
    }
  }

  getPlayerDisplayName(player: any): string {
    // Handle both populated player objects and string IDs
    if (typeof player === 'string') {
      // Player is just an ID string, try to find in our cached members
      const memberFromCache = this.members.find(m => m._id === player);
      if (memberFromCache) {
        return memberFromCache.fullName || memberFromCache.username || 'Player';
      }
      // Show a placeholder if not found
      return `Player (${player.substring(0, 8)}...)`;
    } else if (typeof player === 'object' && player) {
      // Player is a populated object
      return player.fullName || player.username || 'Player';
    }
    return 'Unknown Player';
  }

  getStatCount(statType: string): number {
    switch (statType) {
      case 'club_polls':
        return this.activePolls.filter(poll => !poll.openPlayEvent).length;
      case 'open_play':
        return this.activePolls.filter(poll => poll.openPlayEvent).length;
      case 'create_open':
        return 0; // Placeholder - could be number of events created this month
      case 'match_mgmt':
        return this.activePolls.filter(poll => poll.openPlayEvent?.matchesGenerated).length;
      case 'record_results':
        return 0; // Placeholder - could be number of results recorded
      default:
        return 0;
    }
  }

  getTierLabel(tier: string): string {
    switch (tier) {
      case '100':
        return '100 Open Play';
      case '250':
        return '250 Open Play';
      case '500':
        return '500 Open Play';
      default:
        return '100 Open Play';
    }
  }

  getWinnerPoints(tier: string): number {
    switch (tier) {
      case '100':
        return 10;
      case '250':
        return 25;
      case '500':
        return 50;
      default:
        return 10;
    }
  }

  getRunnerUpPoints(tier: string): number {
    switch (tier) {
      case '100':
        return 5;
      case '250':
        return 15;
      case '500':
        return 30;
      default:
        return 5;
    }
  }

  getConfirmedPlayers(poll: Poll): string[] {
    const yesOption = poll.options.find(option => option.text.toLowerCase() === 'yes');
    if (!yesOption || !yesOption.voters || yesOption.voters.length === 0) {
      return [];
    }

    // Map voter IDs to player names using the cached members list
    const playerNames = yesOption.voters.map(voterId => {
      const member = this.members.find(m => m._id === voterId);
      return member ? (member.fullName || member.username || 'Unknown Player') : `Player (${voterId.substring(0, 8)}...)`;
    });

    // Sort alphabetically for consistent display
    return playerNames.sort();
  }

  getPlayersNotInMatch(poll: Poll, match: any): string[] {
    if (!poll.openPlayEvent?.matches || !match.players) {
      return [];
    }

    const confirmedPlayers = this.getConfirmedPlayers(poll);
    const playersInMatch = match.players.map((player: any) => this.getPlayerDisplayName(player));
    
    // Return players not in this match
    return confirmedPlayers.filter(playerName => !playersInMatch.includes(playerName));
  }

  getPlayerMatchStats(poll: Poll): Array<{playerName: string, matchCount: number}> {
    if (!poll.openPlayEvent?.matches) {
      return [];
    }

    const confirmedPlayers = this.getConfirmedPlayers(poll);
    const playerStats: {[key: string]: number} = {};
    
    // Initialize all players with 0 matches
    confirmedPlayers.forEach(playerName => {
      playerStats[playerName] = 0;
    });
    
    // Count matches for each player
    poll.openPlayEvent.matches.forEach(match => {
      if (match.players) {
        match.players.forEach((player: any) => {
          const playerName = this.getPlayerDisplayName(player);
          if (playerStats.hasOwnProperty(playerName)) {
            playerStats[playerName]++;
          }
        });
      }
    });

    // Convert to array and sort by match count (descending), then by name
    return Object.entries(playerStats)
      .map(([playerName, matchCount]) => ({playerName, matchCount}))
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount;
        }
        return a.playerName.localeCompare(b.playerName);
      });
  }

  getRange(count: number): number[] {
    return Array.from({length: count}, (_, i) => i);
  }

  getMatchStatusClass(match: any): string {
    const classes = [];
    
    if (match.status === 'completed') {
      classes.push('match-completed');
    } else if (match.status === 'in_progress') {
      classes.push('match-in-progress');
    } else {
      classes.push('match-scheduled');
    }
    
    return classes.join(' ');
  }

  getMatchStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'in_progress':
        return 'sports_tennis';
      case 'scheduled':
        return 'schedule';
      default:
        return 'schedule';
    }
  }

  getMatchStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      default:
        return 'Scheduled';
    }
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