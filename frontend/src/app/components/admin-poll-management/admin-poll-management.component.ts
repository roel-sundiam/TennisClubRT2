import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { CloseEventModalComponent, CloseEventModalData } from '../close-event-modal/close-event-modal.component';
import { environment } from '../../../environments/environment';

interface OpenPlayEvent {
  _id: string;
  title: string;
  description: string;
  status: string;
  openPlayEvent: {
    eventDate: Date;
    startTime: number;
    endTime: number;
    playerFee: number;
    maxPlayers: number;
    confirmedPlayers: any[];
    matches?: any[];
    matchesGenerated: boolean;
    blockedTimeSlots: number[];
    tournamentTier: '100' | '250' | '500';
  };
  options: Array<{
    text: string;
    votes: number;
    voters: string[];
  }>;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-poll-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    DragDropModule
  ],
  template: `
    <div class="page-content">
      <!-- Modern Header -->
      <div class="modern-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-content">
            <h1>
              <mat-icon class="header-icon">how_to_vote</mat-icon>
              Poll & Event Management
            </h1>
            <p class="header-subtitle">Manage club polls and Open Play events</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshData()" class="refresh-button" matTooltip="Refresh Data">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>


      <div class="main-content">
        <mat-tab-group [(selectedIndex)]="selectedTab" (selectedTabChange)="onTabChange($event)" class="modern-tabs">
          
          <!-- Traditional Polls Management -->
          <mat-tab label="Club Polls">
            <div class="tab-content">
              <div class="section-header">
                <div class="section-title">
                  <mat-icon>poll</mat-icon>
                  <h2>Club Polls Management</h2>
                </div>
                <button mat-raised-button color="primary" (click)="createNewPoll()">
                  <mat-icon>add</mat-icon>
                  Create New Poll
                </button>
              </div>
              
              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading polls...</p>
              </div>

              <div *ngIf="!loading && getAllTraditionalPolls().length === 0" class="no-data">
                <mat-icon>ballot</mat-icon>
                <h3>No Polls Found</h3>
                <p>Start by creating your first club poll to gather member feedback.</p>
              </div>

              <!-- Active Traditional Polls -->
              <div *ngIf="activeTraditionalPolls.length > 0" class="polls-section">
                <h3 class="section-subtitle">
                  <mat-icon>play_circle</mat-icon>
                  Active Polls ({{activeTraditionalPolls.length}})
                </h3>
                <div class="polls-grid">
                  <mat-card *ngFor="let poll of activeTraditionalPolls" class="poll-management-card">
                    <mat-card-header>
                      <div mat-card-avatar class="poll-avatar" [class]="getPollCategoryClass(poll.metadata?.category)">
                        <mat-icon>{{getPollCategoryIcon(poll.metadata?.category)}}</mat-icon>
                      </div>
                      <mat-card-title>{{poll.title}}</mat-card-title>
                      <mat-card-subtitle>
                        <div class="poll-meta">
                          <span class="status-badge active">ACTIVE</span>
                          <span *ngIf="poll.metadata?.category" class="category-badge">
                            {{getCategoryLabel(poll.metadata?.category)}}
                          </span>
                        </div>
                      </mat-card-subtitle>
                    </mat-card-header>

                    <mat-card-content>
                      <p class="poll-description">{{poll.description}}</p>
                      
                      <div class="poll-stats">
                        <div class="stat-item">
                          <mat-icon>how_to_vote</mat-icon>
                          <span>{{getTotalPollVotes(poll)}} votes</span>
                        </div>
                        <div class="stat-item">
                          <mat-icon>schedule</mat-icon>
                          <span>{{formatDate(poll.createdAt)}}</span>
                        </div>
                      </div>

                      <!-- Poll Options Summary -->
                      <div class="options-summary">
                        <div *ngFor="let option of poll.options" class="option-summary">
                          <div class="option-header">
                            <span class="option-text">{{option.text}}</span>
                            <span class="vote-count">{{option.votes}} votes</span>
                          </div>
                          <div class="vote-bar">
                            <div class="vote-fill" 
                                 [style.width.%]="getPollOptionPercentage(poll, option)">
                            </div>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>

                    <mat-card-actions class="poll-actions">
                      <button mat-button (click)="viewPollDetails(poll)">
                        <mat-icon>visibility</mat-icon>
                        View Results
                      </button>
                      <button mat-button (click)="editPoll(poll)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button mat-button color="warn" (click)="closePoll(poll)">
                        <mat-icon>stop</mat-icon>
                        Close Poll
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>

              <!-- Draft Polls -->
              <div *ngIf="draftPolls.length > 0" class="polls-section">
                <h3 class="section-subtitle">
                  <mat-icon>edit</mat-icon>
                  Draft Polls ({{draftPolls.length}})
                </h3>
                <div class="polls-grid">
                  <mat-card *ngFor="let poll of draftPolls" class="poll-management-card draft-card">
                    <mat-card-header>
                      <div mat-card-avatar class="poll-avatar draft">
                        <mat-icon>edit</mat-icon>
                      </div>
                      <mat-card-title>{{poll.title}}</mat-card-title>
                      <mat-card-subtitle>
                        <span class="status-badge draft">DRAFT</span>
                      </mat-card-subtitle>
                    </mat-card-header>

                    <mat-card-content>
                      <p class="poll-description">{{poll.description}}</p>
                    </mat-card-content>

                    <mat-card-actions class="poll-actions">
                      <button mat-button (click)="editPoll(poll)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button mat-raised-button color="primary" (click)="activatePoll(poll)">
                        <mat-icon>play_arrow</mat-icon>
                        Activate
                      </button>
                      <button mat-button color="warn" (click)="deletePoll(poll)">
                        <mat-icon>delete</mat-icon>
                        Delete
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Open Play Events -->
          <mat-tab label="Open Play Events">
            <div class="tab-content">
              <div class="section-header">
                <div class="section-title">
                  <mat-icon>sports_tennis</mat-icon>
                  <h2>Open Play Events Management</h2>
                </div>
                <button mat-raised-button color="primary" (click)="selectedTab = 2">
                  <mat-icon>add</mat-icon>
                  Create New Event
                </button>
              </div>
              
              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading Open Play events...</p>
              </div>

              <div *ngIf="!loading && openPlayEvents.length === 0" class="no-data">
                <mat-icon>sports_tennis</mat-icon>
                <h3>No Open Play Events</h3>
                <p>Create your first Open Play event to start organizing matches for the club members.</p>
              </div>

              <div *ngIf="!loading && openPlayEvents.length > 0" class="events-section">
                <div class="events-grid">
                  <mat-card *ngFor="let event of openPlayEvents" class="modern-event-card" [class.expanded]="expandedEventId === event._id">
                    <!-- Event Header -->
                    <div class="event-card-header">
                      <div class="event-main-info">
                        <div class="event-icon">
                          <mat-icon>sports_tennis</mat-icon>
                        </div>
                        <div class="event-details">
                          <h3 class="event-title">{{ event.title }}</h3>
                          <div class="event-schedule">
                            <mat-icon class="schedule-icon">event</mat-icon>
                            <span class="event-date">{{ formatEventDate(event.openPlayEvent.eventDate) }}</span>
                          </div>
                          <div class="event-time">
                            <mat-icon class="time-icon">schedule</mat-icon>
                            <span>{{ formatTimeRange(event.openPlayEvent.startTime, event.openPlayEvent.endTime) }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="event-status">
                        <div class="status-badge" [class]="getEventStatusClass(event.status)">
                          <mat-icon>{{ getEventStatusIcon(event.status) }}</mat-icon>
                          <span>{{ event.status | titlecase }}</span>
                        </div>
                      </div>
                    </div>

                    <mat-card-content>
                    <!-- Event Stats Grid -->
                    <div class="event-stats-grid">
                      <div class="stat-card players-stat">
                        <div class="stat-icon">
                          <mat-icon>groups</mat-icon>
                        </div>
                        <div class="stat-content">
                          <div class="stat-value">
                            <span class="current-players">{{ event.openPlayEvent.confirmedPlayers.length }}</span>
                            <span class="separator">/</span>
                            <span class="max-players">{{ event.openPlayEvent.maxPlayers }}</span>
                          </div>
                          <div class="stat-label">Players</div>
                          <div class="progress-indicator">
                            <div class="progress-bar">
                              <div class="progress-fill" 
                                   [style.width.%]="(event.openPlayEvent.confirmedPlayers.length / event.openPlayEvent.maxPlayers) * 100">
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="stat-card fee-stat">
                        <div class="stat-icon">
                          <mat-icon>payments</mat-icon>
                        </div>
                        <div class="stat-content">
                          <div class="stat-value">₱{{ event.openPlayEvent.playerFee }}</div>
                          <div class="stat-label">Entry Fee</div>
                        </div>
                      </div>

                      <div class="stat-card tier-stat">
                        <div class="stat-icon">
                          <mat-icon>emoji_events</mat-icon>
                        </div>
                        <div class="stat-content">
                          <div class="stat-value">{{ event.openPlayEvent.tournamentTier }}</div>
                          <div class="stat-label">Tournament Tier</div>
                        </div>
                      </div>

                      <div class="stat-card matches-stat" *ngIf="event.openPlayEvent.matchesGenerated">
                        <div class="stat-icon">
                          <mat-icon>sports_tennis</mat-icon>
                        </div>
                        <div class="stat-content">
                          <div class="stat-value">{{ event.openPlayEvent.matches?.length || 0 }}</div>
                          <div class="stat-label">Matches</div>
                        </div>
                      </div>
                    </div>

                    <!-- Participation Summary -->
                    <div class="participation-summary">
                      <h4 class="summary-title">
                        <mat-icon>how_to_vote</mat-icon>
                        Participation Summary
                      </h4>
                      <div class="vote-stats">
                        <div class="vote-option" *ngFor="let option of event.options">
                          <div class="vote-indicator" [class]="option.text.toLowerCase() === 'yes' ? 'yes-indicator' : 'no-indicator'">
                            <mat-icon>{{ option.text.toLowerCase() === 'yes' ? 'thumb_up' : 'thumb_down' }}</mat-icon>
                            <span class="vote-text">{{ option.text }}</span>
                            <span class="vote-count">{{ option.votes }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Modern Vote Management Section -->
                    <div class="modern-vote-management" *ngIf="expandedEventId === event._id">
                      <div class="management-header">
                        <mat-icon class="management-icon">how_to_vote</mat-icon>
                        <h3 class="management-title">Vote Management</h3>
                        <div class="management-badge">
                          <span>{{ getTotalVoters(event) }} Total Voters</span>
                        </div>
                      </div>
                      
                      <!-- Modern Current Voters Display -->
                      <div class="modern-voters-grid" *ngIf="event.options.length > 0">
                        <div *ngFor="let option of event.options" class="modern-voter-section">
                          <div class="voter-section-header">
                            <div class="vote-type-indicator" [class]="option.text.toLowerCase() === 'yes' ? 'yes-type' : 'no-type'">
                              <mat-icon>{{ option.text.toLowerCase() === 'yes' ? 'thumb_up' : 'thumb_down' }}</mat-icon>
                              <span class="vote-type-text">{{ option.text }} Votes</span>
                              <span class="vote-type-count">{{ option.voters.length }}</span>
                            </div>
                          </div>
                          <div class="modern-voter-chips">
                            <div *ngFor="let voterId of option.voters" class="modern-voter-chip">
                              <div class="voter-info">
                                <mat-icon class="voter-icon">person</mat-icon>
                                <span class="voter-name">{{ getPlayerDisplayName(voterId) }}</span>
                              </div>
                              <button mat-icon-button 
                                      class="remove-vote-btn" 
                                      (click)="removeVote(event._id, option.text, voterId)"
                                      matTooltip="Remove this vote">
                                <mat-icon>close</mat-icon>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Modern Add Vote Section -->
                      <div class="modern-add-vote-section">
                        <div class="add-vote-header">
                          <mat-icon class="add-vote-icon">person_add</mat-icon>
                          <h4 class="add-vote-title">Add New Vote</h4>
                        </div>
                        <div class="modern-add-vote-form">
                          <div class="form-row">
                            <mat-form-field appearance="outline" class="modern-player-select">
                              <mat-label>Select Player</mat-label>
                              <mat-select [(value)]="selectedPlayerId" placeholder="Choose a player">
                                <mat-option value="">
                                  <em>Select a player...</em>
                                </mat-option>
                                <mat-option *ngFor="let player of getAvailablePlayers(event)" [value]="player._id">
                                  {{ player.fullName || player.username || 'Unknown Player' }}
                                </mat-option>
                              </mat-select>
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="modern-vote-select">
                              <mat-label>Vote Choice</mat-label>
                              <mat-select [(value)]="selectedVoteOption" placeholder="Choose vote option">
                                <mat-option value="">
                                  <em>Select vote option...</em>
                                </mat-option>
                                <mat-option *ngFor="let option of event.options" [value]="option.text">
                                  {{ option.text }}
                                </mat-option>
                              </mat-select>
                            </mat-form-field>
                            <button mat-raised-button 
                                    class="modern-add-vote-btn" 
                                    (click)="addVote(event._id, selectedVoteOption, selectedPlayerId)"
                                    [disabled]="!selectedPlayerId || !selectedVoteOption">
                              <mat-icon>add</mat-icon>
                              <span>Add Vote</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    </mat-card-content>
                    
                    <mat-card-actions class="modern-card-actions">
                      <button mat-raised-button 
                              class="primary-action-btn"
                              (click)="toggleVoteManagement(event._id)">
                        <mat-icon>{{ expandedEventId === event._id ? 'expand_less' : 'expand_more' }}</mat-icon>
                        <span>{{ expandedEventId === event._id ? 'Hide' : 'Manage' }} Votes</span>
                      </button>
                      <button 
                        mat-button 
                        color="accent" 
                        *ngIf="event.openPlayEvent.confirmedPlayers.length >= 4"
                        (click)="generateMatches(event._id)"
                        [disabled]="generatingMatches">
                        <mat-icon>shuffle</mat-icon>
                        {{ event.openPlayEvent.matchesGenerated ? 'Regenerate Matches' : 'Generate Matches' }}
                      </button>
                      <button 
                        mat-button 
                        *ngIf="event.openPlayEvent.matchesGenerated"
                        (click)="viewMatches(event)">
                        <mat-icon>sports_tennis</mat-icon>
                        View Matches
                      </button>
                      <button 
                        mat-raised-button
                        color="primary"
                        *ngIf="event.openPlayEvent.matchesGenerated"
                        (click)="recordMatchResults(event)">
                        <mat-icon>emoji_events</mat-icon>
                        Record Results
                      </button>
                      <button 
                        mat-button
                        color="warn"
                        *ngIf="event.status === 'active'"
                        (click)="closeOpenPlayEvent(event)">
                        <mat-icon>stop</mat-icon>
                        Close Event
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Create Open Play -->
          <mat-tab label="Create Open Play">
            <div class="tab-content">
              <div class="section-header">
                <h2>Create New Open Play Event</h2>
                <p>Create an Open Play event and automatically notify all members</p>
              </div>

              <mat-card class="form-card">
                <mat-card-content>
                  <form [formGroup]="openPlayForm" (ngSubmit)="createOpenPlay()">
                    <div class="form-row">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Event Title</mat-label>
                        <input matInput formControlName="title" placeholder="e.g., Weekend Open Play">
                        <mat-error *ngIf="openPlayForm.get('title')?.hasError('required')">
                          Title is required
                        </mat-error>
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Description</mat-label>
                        <textarea matInput formControlName="description" rows="3" 
                          placeholder="Optional description for the Open Play event"></textarea>
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Tournament Tier</mat-label>
                        <mat-select formControlName="tournamentTier">
                          <mat-option value="100">100 Series - Regular Open Play (Winner: 10 pts, Participants: 5 pts)</mat-option>
                          <mat-option value="250">250 Series - Special Events (Winner: 250 pts, Participants: 50 pts)</mat-option>
                          <mat-option value="500">500 Series - Championships (Winner: 500 pts, Participants: 100 pts)</mat-option>
                        </mat-select>
                        <mat-hint>Select tournament tier for seeding point awards</mat-hint>
                        <mat-error *ngIf="openPlayForm.get('tournamentTier')?.hasError('required')">
                          Tournament tier is required
                        </mat-error>
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Event Date</mat-label>
                        <input matInput [matDatepicker]="picker" formControlName="eventDate" readonly>
                        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                        <mat-datepicker #picker></mat-datepicker>
                        <mat-error *ngIf="openPlayForm.get('eventDate')?.hasError('required')">
                          Event date is required
                        </mat-error>
                      </mat-form-field>
                    </div>

                    <div class="form-row two-columns">
                      <mat-form-field appearance="outline">
                        <mat-label>Start Time</mat-label>
                        <mat-select formControlName="startTime">
                          <mat-option *ngFor="let time of timeSlots" [value]="time.value">
                            {{ time.display }}
                          </mat-option>
                        </mat-select>
                        <mat-error *ngIf="openPlayForm.get('startTime')?.hasError('required')">
                          Start time is required
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>End Time</mat-label>
                        <mat-select formControlName="endTime">
                          <mat-option *ngFor="let time of getValidEndTimes()" [value]="time.value">
                            {{ time.display }}
                          </mat-option>
                        </mat-select>
                        <mat-error *ngIf="openPlayForm.get('endTime')?.hasError('required')">
                          End time is required
                        </mat-error>
                        <mat-error *ngIf="openPlayForm.get('endTime')?.hasError('invalidRange')">
                          End time must be after start time
                        </mat-error>
                      </mat-form-field>
                    </div>

                    <div class="form-summary">
                      <div class="summary-item">
                        <mat-icon>people</mat-icon>
                        <span>Maximum 12 players</span>
                      </div>
                      <div class="summary-item">
                        <mat-icon>attach_money</mat-icon>
                        <span>₱150 per player</span>
                      </div>
                      <div class="summary-item">
                        <mat-icon>shuffle</mat-icon>
                        <span>Random doubles matches generated</span>
                      </div>
                      <div class="summary-item">
                        <mat-icon>notifications</mat-icon>
                        <span>All members will be notified automatically</span>
                      </div>
                    </div>

                    <div class="form-actions">
                      <button type="button" mat-button (click)="resetForm()">
                        <mat-icon>clear</mat-icon>
                        Reset
                      </button>
                      <button type="submit" mat-raised-button color="primary" 
                              [disabled]="openPlayForm.invalid || creatingEvent">
                        <mat-icon *ngIf="!creatingEvent">add</mat-icon>
                        <mat-spinner *ngIf="creatingEvent" diameter="20"></mat-spinner>
                        {{ creatingEvent ? 'Creating...' : 'Create Open Play Event' }}
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Match Management -->
          <mat-tab label="Match Management">
            <div class="tab-content">
              <div class="section-header">
                <h2>Generated Matches</h2>
                <p>View and manage doubles matches for Open Play events</p>
              </div>

              <div *ngIf="!generatedMatches || generatedMatches.length === 0" class="no-data">
                <mat-icon>sports_tennis</mat-icon>
                <h3>No Generated Matches</h3>
                <p>Matches will appear here after generating them from closed Open Play events.</p>
              </div>

              <div *ngIf="generatedMatches && generatedMatches.length > 0" class="matches-container">
                <mat-card *ngFor="let matchSet of generatedMatches; let idx = index" class="match-set-card">
                  <mat-card-header>
                    <mat-card-title>{{ matchSet.eventTitle }}</mat-card-title>
                    <mat-card-subtitle>{{ formatEventDate(matchSet.eventDate) }} {{ formatTimeRange(matchSet.startTime, matchSet.endTime) }}</mat-card-subtitle>
                  </mat-card-header>
                  
                  <mat-card-content>
                    <div class="matches-header">
                      <mat-icon>info</mat-icon>
                      <span>Use arrow buttons or drag to swap matches</span>
                    </div>
                    <div class="matches-grid" 
                         cdkDropList 
                         (cdkDropListDropped)="dropMatch($event, matchSet)">
                      <div *ngFor="let match of matchSet.matches; let i = index" 
                           class="match-card"
                           cdkDrag>
                        <div class="drag-handle" cdkDragHandle>
                          <mat-icon>drag_indicator</mat-icon>
                        </div>
                        <div class="court-header">
                          <div class="court-info">
                            <mat-icon>sports_tennis</mat-icon>
                            <span>Court {{ match.court }}, Match {{ i + 1 }}</span>
                          </div>
                          <div class="swap-controls">
                            <button mat-icon-button *ngIf="i > 0" 
                                    (click)="swapMatches(matchSet, i, i-1)"
                                    matTooltip="Swap with previous match"
                                    class="swap-btn">
                              <mat-icon>keyboard_arrow_up</mat-icon>
                            </button>
                            <button mat-icon-button *ngIf="i < matchSet.matches.length - 1" 
                                    (click)="swapMatches(matchSet, i, i+1)"
                                    matTooltip="Swap with next match"
                                    class="swap-btn">
                              <mat-icon>keyboard_arrow_down</mat-icon>
                            </button>
                          </div>
                        </div>
                        <div class="match-format">
                          <div class="team">
                            <span class="team-label">{{ getTeamDisplayName([match.players[0], match.players[1]]) }}:</span>
                            <span class="players">{{ getPlayerDisplayName(match.players[0]) }} / {{ getPlayerDisplayName(match.players[1]) }}</span>
                          </div>
                          <div class="vs-divider">
                            <span class="vs-text">VS</span>
                          </div>
                          <div class="team">
                            <span class="team-label">{{ getTeamDisplayName([match.players[2], match.players[3]]) }}:</span>
                            <span class="players">{{ getPlayerDisplayName(match.players[2]) }} / {{ getPlayerDisplayName(match.players[3]) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="match-actions">
                      <button mat-button color="primary" (click)="saveMatchOrder(matchSet)">
                        <mat-icon>save</mat-icon>
                        Save Order
                      </button>
                      <button mat-button (click)="resetMatchOrder(matchSet)">
                        <mat-icon>refresh</mat-icon>
                        Reset
                      </button>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Record Match Results -->
          <mat-tab label="Record Results" [disabled]="!selectedEvent">
            <div class="tab-content">
              <div class="section-header">
                <h2>Record Match Results</h2>
                <p *ngIf="selectedEvent">{{ selectedEvent.title }} - {{ selectedEvent.openPlayEvent.tournamentTier }} Series</p>
              </div>

              <div *ngIf="!selectedEvent" class="no-event-selected">
                <mat-icon>info</mat-icon>
                <h3>Select an Event</h3>
                <p>Click "Record Results" on an Open Play event to record match winners and award seeding points.</p>
              </div>

              <div *ngIf="selectedEvent && eventMatches.length > 0" class="matches-container">
                <div class="match-card" *ngFor="let match of eventMatches">
                  <mat-card>
                    <mat-card-header>
                      <mat-icon mat-card-avatar [class]="getMatchStatusClass(match.status)">sports_tennis</mat-icon>
                      <mat-card-title>Match {{ match.matchNumber }}</mat-card-title>
                      <mat-card-subtitle>
                        <span class="tier-badge" [class]="'tier-' + selectedEvent.openPlayEvent.tournamentTier">
                          {{ selectedEvent.openPlayEvent.tournamentTier }} Series
                        </span>
                        <span class="status-badge" [class]="match.status">{{ match.status | titlecase }}</span>
                      </mat-card-subtitle>
                    </mat-card-header>

                    <mat-card-content>
                      <!-- Teams Display -->
                      <div class="teams-container">
                        <div class="team" [class.winning-team]="match.winningTeam === 1">
                          <div class="team-header">
                            <h4>{{ getTeamName(getTeamFromMatch(match, 1)) }}</h4>
                            <mat-icon *ngIf="match.winningTeam === 1" class="crown">emoji_events</mat-icon>
                          </div>
                          <div class="players">
                            <div class="player" *ngFor="let player of getTeamFromMatch(match, 1)">
                              {{ getPlayerName(player) }}
                            </div>
                          </div>
                        </div>

                        <div class="vs-divider">VS</div>

                        <div class="team" [class.winning-team]="match.winningTeam === 2">
                          <div class="team-header">
                            <h4>{{ getTeamName(getTeamFromMatch(match, 2)) }}</h4>
                            <mat-icon *ngIf="match.winningTeam === 2" class="crown">emoji_events</mat-icon>
                          </div>
                          <div class="players">
                            <div class="player" *ngFor="let player of getTeamFromMatch(match, 2)">
                              {{ getPlayerName(player) }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Score Display -->
                      <div *ngIf="match.score" class="score-display">
                        <mat-icon>sports_score</mat-icon>
                        <strong>{{ match.score }}</strong>
                      </div>

                      <!-- Result Recording Form -->
                      <div *ngIf="match.status !== 'completed'" class="result-form">
                        <h4>Record Match Score</h4>
                        <mat-form-field appearance="outline" class="score-input">
                          <mat-label>Match Score</mat-label>
                          <input matInput [(ngModel)]="match.tempScore" 
                                 placeholder="e.g., 6-4 6-2, 21-19, 8-6, etc.">
                          <mat-hint>Enter the final score (optional but recommended)</mat-hint>
                        </mat-form-field>
                        
                        <!-- Score format examples -->
                        <div class="score-examples">
                          <small><strong>Score Examples:</strong></small>
                          <div class="examples-list">
                            <span class="example">• Tennis: 6-4 6-2</span>
                            <span class="example">• Single Set: 8-6</span>
                            <span class="example">• Tiebreak: 21-19</span>
                            <span class="example">• Pro Set: 8-5</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>

                    <mat-card-actions *ngIf="match.status !== 'completed'" class="winner-buttons">
                      <div class="action-header">
                        <mat-icon>sports_score</mat-icon>
                        <span>Record Winner & Score</span>
                      </div>
                      <div class="button-row">
                        <button mat-raised-button 
                                color="primary" 
                                (click)="recordWinner(match, 1)"
                                [disabled]="recordingResult"
                                class="winner-button">
                          <mat-icon>emoji_events</mat-icon>
                          {{ getTeamName(getTeamFromMatch(match, 1)) }} Wins
                        </button>
                        <button mat-raised-button 
                                color="primary" 
                                (click)="recordWinner(match, 2)"
                                [disabled]="recordingResult"
                                class="winner-button">
                          <mat-icon>emoji_events</mat-icon>
                          {{ getTeamName(getTeamFromMatch(match, 2)) }} Wins
                        </button>
                      </div>
                      <small class="score-note">💡 Enter score above, then click winner button</small>
                    </mat-card-actions>

                    <mat-card-actions *ngIf="match.status === 'completed'">
                      <button mat-button (click)="editResult(match)">
                        <mat-icon>edit</mat-icon>
                        Edit Result
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>

                <!-- Summary -->
                <mat-card class="results-summary" *ngIf="getCompletedMatches().length > 0">
                  <mat-card-header>
                    <mat-icon mat-card-avatar>analytics</mat-icon>
                    <mat-card-title>Results Summary</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <p><strong>2</strong> of <strong>3</strong> matches completed</p>
                    <div class="points-awarded">
                      <h4>Points Awarded (100 Series):</h4>
                      <ul>
                        <li>Winners: <strong>10 points each</strong></li>
                        <li>Participants: <strong>5 points each</strong></li>
                      </ul>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <div *ngIf="selectedEvent && eventMatches.length === 0" class="loading-matches">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading matches...</p>
              </div>
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .page-content {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%);
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Modern Header */
    .modern-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px 32px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%);
      color: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
      backdrop-filter: blur(20px);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-content h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .back-button, .refresh-button {
      background: rgba(255,255,255,0.2);
      color: white;
      border-radius: 12px;
    }

    .back-button:hover, .refresh-button:hover {
      background: rgba(255,255,255,0.3);
    }


    /* Main Content */
    .main-content {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .modern-tabs {
      --mdc-tab-height: 60px;
    }

    .modern-tabs .mat-mdc-tab {
      min-width: 160px;
    }

    .modern-tabs .mat-mdc-tab .mdc-tab__text-label {
      font-size: 16px;
      font-weight: 600;
    }

    .tab-content {
      padding: 32px;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title mat-icon {
      color: #667eea;
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
    }

    .section-title h2 {
      margin: 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
    }

    .section-subtitle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 32px 0 16px 0;
      color: #555;
      font-size: 18px;
      font-weight: 600;
    }

    .section-subtitle mat-icon {
      color: #667eea;
    }

    /* Polls Grid */
    .polls-section {
      margin-bottom: 48px;
    }

    .polls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
    }

    .poll-management-card {
      border-radius: 20px;
      border: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .poll-management-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }

    .poll-management-card.draft-card {
      border-left: 4px solid #FF9800;
    }

    /* Poll Avatars */
    .poll-avatar {
      border-radius: 12px !important;
      color: white !important;
    }

    .poll-avatar.club-policy {
      background: linear-gradient(135deg, #2196F3, #1976D2) !important;
    }

    .poll-avatar.facility {
      background: linear-gradient(135deg, #4CAF50, #45a049) !important;
    }

    .poll-avatar.general {
      background: linear-gradient(135deg, #9C27B0, #7B1FA2) !important;
    }

    .poll-avatar.draft {
      background: linear-gradient(135deg, #FF9800, #F57C00) !important;
    }

    /* Status and Category Badges */
    .poll-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.active {
      background: #E8F5E8;
      color: #2E7D32;
    }

    .status-badge.draft {
      background: #FFF3E0;
      color: #F57C00;
    }

    .category-badge {
      background: #E3F2FD;
      color: #1976D2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* Poll Content */
    .poll-description {
      color: #666;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .poll-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #666;
    }

    .stat-item mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #999;
    }

    /* Options Summary */
    .options-summary {
      margin-top: 16px;
    }

    .option-summary {
      margin-bottom: 12px;
    }

    .option-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .option-text {
      font-weight: 500;
      color: #333;
    }

    .vote-count {
      font-size: 12px;
      color: #666;
      font-weight: 600;
    }

    .vote-bar {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .vote-fill {
      height: 100%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* Poll Actions */
    .poll-actions {
      padding: 16px !important;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
      gap: 8px;
    }

    .poll-actions button {
      flex: 1;
      border-radius: 8px;
      font-weight: 500;
    }

    /* Loading and No Data States */
    .loading-container, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      color: #666;
    }

    .loading-container mat-spinner {
      margin-bottom: 20px;
    }

    .no-data mat-icon {
      font-size: 64px !important;
      width: 64px !important;
      height: 64px !important;
      color: #ccc;
      margin-bottom: 16px;
    }

    .no-data h3 {
      margin: 0 0 8px 0;
      color: #555;
      font-size: 20px;
      font-weight: 600;
    }

    .no-data p {
      margin: 0;
      color: #999;
      text-align: center;
      max-width: 400px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .admin-poll-management {
        padding: 16px;
      }
      
      .modern-header {
        padding: 20px;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
      
      .header-left {
        justify-content: center;
      }
      
      .stats-overview {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      
      .stat-content {
        padding: 20px;
      }
      
      .tab-content {
        padding: 20px;
      }
      
      .polls-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .section-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
        text-align: center;
      }
    }

    .section-header h2 {
      margin: 0 0 8px 0;
      color: #333;
      font-weight: 500;
    }

    .section-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .loading-container, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .events-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-top: 28px;
      padding: 4px;
    }

    .event-card {
      border: 1px solid #e0e0e0;
    }

    .event-stats {
      display: flex;
      gap: 16px;
      margin: 16px 0;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #666;
    }

    .stat mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .votes-summary {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .yes-chip {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .no-chip {
      background-color: #f44336 !important;
      color: white !important;
    }

    .vote-management {
      margin-top: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .vote-management h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 500;
    }

    .vote-management h5 {
      margin: 12px 0 8px 0;
      color: #555;
      font-size: 14px;
      font-weight: 500;
    }

    .option-voters {
      margin-bottom: 16px;
    }

    .voter-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .voter-chip {
      background: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .voter-chip mat-icon {
      cursor: pointer;
      margin-left: 4px;
    }

    .add-vote-section {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
    }

    .add-vote-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .player-select, .vote-select {
      min-width: 180px;
      flex: 1;
    }

    .status-active { color: #4caf50; }
    .status-closed { color: #ff9800; }
    .status-draft { color: #2196f3; }

    .form-card {
      max-width: 600px;
      margin: 0 auto;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .form-summary {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: #666;
    }

    .summary-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .matches-container {
      margin-top: 20px;
    }

    .match-set-card {
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
    }

    .matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .match-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: #fafafa;
      border-left: 4px solid #4CAF50;
    }

    .court-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      font-weight: 600;
      color: #2e7d32;
      font-size: 14px;
    }

    .court-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .swap-controls {
      display: flex;
      gap: 4px;
    }

    .swap-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
      color: #666;
    }

    .swap-btn:hover {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .court-header mat-icon {
      color: #4caf50;
    }

    .match-format {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .team {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .team-label {
      font-size: 12px;
      color: #666;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .players {
      padding: 10px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #ddd;
      font-weight: 500;
      font-size: 14px;
    }
    
    .vs-divider {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 8px 0;
    }
    
    .vs-text {
      background: #2e7d32;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    /* Drag and Drop Styles */
    .matches-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 6px;
      color: #1976d2;
      font-size: 14px;
    }

    .matches-header mat-icon {
      font-size: 18px;
      color: #1976d2;
    }

    .match-card.cdk-drag {
      position: relative;
      cursor: move;
      transition: all 0.2s ease;
    }

    .match-card.cdk-drag:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .match-card.cdk-drag-disabled {
      cursor: not-allowed;
    }

    .match-card.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drop-list-dragging .match-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .drag-handle {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #999;
      cursor: grab;
      transition: color 0.2s ease;
    }

    .drag-handle:hover {
      color: #666;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .drag-handle mat-icon {
      font-size: 20px;
    }

    .match-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .match-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .admin-poll-management {
        padding: 10px;
      }
      
      .events-grid {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 20px;
        padding: 2px;
      }
      
      .two-columns {
        grid-template-columns: 1fr;
      }
      
      .form-card {
        max-width: none;
      }
    }

    /* Match Results Recording Styles */
    .no-event-selected {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-event-selected mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ddd;
    }

    .matches-container {
      display: grid;
      gap: 20px;
    }

    .match-card {
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .match-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .completed-icon {
      background: #4CAF50 !important;
      color: white !important;
    }

    .in-progress-icon {
      background: #FF9800 !important;
      color: white !important;
    }

    .scheduled-icon {
      background: #2196F3 !important;
      color: white !important;
    }

    .teams-container {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      align-items: center;
      margin: 20px 0;
    }

    .team {
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
      transition: all 0.3s ease;
    }

    .team.winning-team {
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    }

    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .team-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .crown {
      color: #FFD700 !important;
      font-size: 24px !important;
    }

    .players {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .player {
      padding: 8px 12px;
      background: rgba(255,255,255,0.8);
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
    }

    .team.winning-team .player {
      background: rgba(255,255,255,0.9);
      color: #333;
    }

    .vs-divider {
      font-size: 20px;
      font-weight: 700;
      color: #666;
      text-align: center;
      padding: 16px;
      background: #e0e0e0;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .score-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 16px 0;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
      font-size: 18px;
    }

    .result-form {
      margin: 20px 0;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .result-form h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .result-form h4::before {
      content: "📝";
      font-size: 18px;
    }

    .score-input {
      width: 100%;
      margin-bottom: 12px;
    }

    .score-examples {
      margin-top: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 6px;
      border: 1px solid #ddd;
    }

    .score-examples small {
      color: #666;
      font-weight: 600;
    }

    .examples-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }

    .example {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 8px;
    }

    .status-badge.scheduled {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-badge.completed {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-badge.in_progress {
      background: #fff3e0;
      color: #f57c00;
    }

    .results-summary {
      margin-top: 30px;
      border: 2px solid #4CAF50;
    }

    .points-awarded {
      margin-top: 16px;
    }

    .points-awarded h4 {
      color: #4CAF50;
      margin-bottom: 12px;
    }

    .points-awarded ul {
      margin: 0;
      padding-left: 20px;
    }

    .points-awarded li {
      margin-bottom: 8px;
      color: #666;
    }

    .loading-matches {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .loading-matches mat-spinner {
      margin: 0 auto 20px;
    }

    .winner-buttons {
      padding: 16px !important;
      background: #f5f5f5;
      border-top: 2px solid #e0e0e0;
    }

    .action-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #333;
      font-weight: 600;
    }

    .action-header mat-icon {
      color: #4CAF50;
    }

    .button-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 8px;
    }

    .winner-button {
      flex: 1;
      max-width: 200px;
      padding: 12px 20px !important;
      font-weight: 600 !important;
    }

    .score-note {
      display: block;
      text-align: center;
      color: #666;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .teams-container {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .vs-divider {
        width: 40px;
        height: 40px;
        font-size: 14px;
      }

      .match-card {
        margin: 0 -8px;
      }

      .button-row {
        flex-direction: column;
        gap: 8px;
      }

      .winner-button {
        max-width: none;
      }

      .examples-list {
        flex-direction: column;
        gap: 6px;
      }
    }

    /* Modern Event Cards Styles */
    .modern-event-card {
      margin-bottom: 0 !important;
      border-radius: 20px !important;
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08) !important;
      border: none !important;
      background: #ffffff !important;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      overflow: hidden !important;
      position: relative !important;
    }

    .modern-event-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .modern-event-card:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
      transform: translateY(-4px) !important;
    }

    .modern-event-card:hover::before {
      opacity: 1;
    }

    .modern-event-card.expanded {
      box-shadow: 0 16px 50px rgba(0, 0, 0, 0.18) !important;
      transform: translateY(-2px) !important;
    }

    .modern-event-card.expanded::before {
      opacity: 1;
    }

    .event-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 28px 28px 20px 28px;
      background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      position: relative;
    }

    .event-main-info {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex: 1;
    }

    .event-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #1976d2, #42a5f5);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
    }

    .event-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .event-details h3.event-title {
      margin: 0 0 10px 0;
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.4;
      letter-spacing: -0.025em;
    }

    .event-schedule, .event-time {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
      color: #475569;
      font-size: 15px;
      font-weight: 500;
    }

    .schedule-icon, .time-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #888;
    }

    .event-status {
      display: flex;
      align-items: flex-start;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-active {
      background: linear-gradient(135deg, #4caf50, #66bb6a);
      color: white;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }

    .status-closed {
      background: linear-gradient(135deg, #ff9800, #ffb74d);
      color: white;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
    }

    .status-completed {
      background: linear-gradient(135deg, #2196f3, #64b5f6);
      color: white;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    }

    .status-cancelled {
      background: linear-gradient(135deg, #f44336, #ef5350);
      color: white;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
    }

    .status-pending {
      background: linear-gradient(135deg, #9e9e9e, #bdbdbd);
      color: white;
      box-shadow: 0 2px 8px rgba(158, 158, 158, 0.3);
    }

    .event-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, max-content);
      gap: 12px;
      padding: 0 24px 16px 24px;
      margin-bottom: 16px;
      justify-content: start;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(0, 0, 0, 0.03);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      min-height: 42px;
      max-height: 48px;
      width: max-content;
      min-width: fit-content;
    }

    .stat-card:hover {
      background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    }

    .players-stat {
      background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
      border-color: #2196f3 !important;
    }

    .fee-stat {
      background: linear-gradient(135deg, #f1f8e9, #c8e6c9) !important;
      border-color: #4caf50 !important;
    }

    .tier-stat {
      background: linear-gradient(135deg, #fff3e0, #ffe0b2) !important;
      border-color: #ff9800 !important;
    }

    .matches-stat {
      background: linear-gradient(135deg, #fce4ec, #f8bbd9) !important;
      border-color: #e91e63 !important;
    }

    .stat-icon {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .players-stat .stat-icon {
      background: linear-gradient(135deg, #1976d2, #42a5f5);
    }

    .fee-stat .stat-icon {
      background: linear-gradient(135deg, #388e3c, #66bb6a);
    }

    .tier-stat .stat-icon {
      background: linear-gradient(135deg, #f57c00, #ffb74d);
    }

    .matches-stat .stat-icon {
      background: linear-gradient(135deg, #c2185b, #f06292);
    }

    .stat-content {
      flex: 1;
      min-width: 0;
      overflow: visible;
      text-align: left;
    }

    .stat-value {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 2px;
      letter-spacing: -0.01em;
      line-height: 1.2;
      text-align: left;
    }

    .current-players {
      color: #1976d2;
    }

    .separator {
      color: #999;
      font-weight: 400;
    }

    .max-players {
      color: #666;
      font-weight: 500;
    }

    .stat-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.1;
      white-space: nowrap;
      text-align: left;
    }

    .progress-indicator {
      margin-top: 8px;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1976d2, #42a5f5);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .participation-summary {
      padding: 0 24px 16px 24px;
      margin-bottom: 16px;
    }

    .summary-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .vote-stats {
      display: flex;
      gap: 16px;
    }

    .vote-option {
      display: flex;
      flex: 1;
    }

    .vote-indicator {
      flex: 1;
      padding: 12px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .yes-indicator {
      background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
      color: #2e7d32;
      border: 2px solid #4caf50;
    }

    .no-indicator {
      background: linear-gradient(135deg, #ffebee, #ffcdd2);
      color: #c62828;
      border: 2px solid #f44336;
    }

    .vote-indicator:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .vote-text {
      font-weight: 600;
    }

    .vote-count {
      margin-left: auto;
      background: rgba(0, 0, 0, 0.1);
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }

    .vote-management {
      padding: 0 24px 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      margin-top: 16px;
      padding-top: 20px;
    }

    .vote-management h4 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .current-voters {
      margin-bottom: 24px;
    }

    .option-voters {
      margin-bottom: 16px;
    }

    .option-voters h5 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #666;
    }

    .voter-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .voter-chip {
      background: #f5f5f5 !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 20px !important;
    }

    .add-vote-section h5 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .add-vote-form {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .player-select {
      flex: 2;
    }

    .vote-select {
      flex: 1;
    }

    .add-vote-form button {
      height: 56px;
      border-radius: 12px !important;
      font-weight: 600 !important;
      padding: 0 24px !important;
    }

    @media (max-width: 768px) {
      .event-stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        padding: 0 20px 16px 20px;
      }

      .vote-stats {
        flex-direction: column;
        gap: 8px;
      }

      .add-vote-form {
        flex-direction: column;
        gap: 16px;
      }

      .add-vote-form button {
        width: 100%;
      }

      .event-card-header {
        padding: 24px 20px 16px 20px;
      }

      .event-stats-grid,
      .participation-summary,
      .vote-management {
        padding-left: 20px;
        padding-right: 20px;
      }
      
      .modern-event-card {
        border-radius: 16px !important;
      }

      .stat-card {
        padding: 12px !important;
        gap: 10px !important;
        border-radius: 10px !important;
        min-height: 60px !important;
      }

      .event-details h3.event-title {
        font-size: 22px !important;
      }

      .stat-value {
        font-size: 18px !important;
      }
    }

    /* Modern Vote Management Styles */
    .modern-vote-management {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 16px;
      margin-top: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .management-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .management-icon {
      color: #4a5568 !important;
      font-size: 20px !important;
    }

    .management-title {
      color: #2d3748 !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      margin: 0 !important;
      flex: 1;
    }

    .management-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 4px 12px;
      border-radius: 12px;
      border: none;
    }

    .management-badge span {
      color: white;
      font-size: 12px;
      font-weight: 500;
    }

    .modern-voters-grid {
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
    }

    .modern-voter-option {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 12px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .modern-voter-option:hover {
      background: #f7fafc;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .option-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .option-name {
      color: #2d3748;
      font-weight: 500;
      font-size: 14px;
    }

    .option-count {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      font-weight: 600;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }

    .voters-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .voter-name-chip {
      background: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      font-size: 10px !important;
      padding: 2px 6px !important;
      border-radius: 8px !important;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .no-voters-message {
      color: #a0aec0;
      font-style: italic;
      font-size: 11px;
    }

    .add-vote-section {
      background: white;
      border-radius: 8px;
      padding: 12px;
      border: 1px dashed #cbd5e0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .add-vote-title {
      color: #2d3748;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .add-vote-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    /* Modern Voter Chips Styling */
    .modern-voter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .modern-voter-chip {
      background: #f7fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 20px !important;
      padding: 6px 12px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      transition: all 0.3s ease !important;
    }

    .modern-voter-chip:hover {
      background: #edf2f7 !important;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .voter-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .voter-icon {
      color: #4a5568 !important;
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .voter-name {
      color: #2d3748 !important;
      font-size: 12px !important;
      font-weight: 500 !important;
    }

    .remove-vote-btn {
      width: 20px !important;
      height: 20px !important;
      line-height: 20px !important;
      min-width: 20px !important;
      padding: 0 !important;
      background: #e2e8f0 !important;
      border-radius: 50% !important;
    }

    .remove-vote-btn mat-icon {
      color: #718096 !important;
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }

    .remove-vote-btn:hover {
      background: #fed7d7 !important;
    }

    .remove-vote-btn:hover mat-icon {
      color: #e53e3e !important;
    }

    /* Vote Type Header Styling */
    .vote-type-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .vote-type-text {
      color: #2d3748 !important;
      font-weight: 500 !important;
      font-size: 14px !important;
      flex: 1;
    }

    .vote-type-count {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
      color: white !important;
      font-weight: 600 !important;
      font-size: 11px !important;
      padding: 3px 8px !important;
      border-radius: 10px !important;
      min-width: 20px !important;
      text-align: center !important;
    }

    /* Ultra-Modern Add Vote Controls Styling */
    .modern-add-vote-form {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    /* Premium Form Fields with Maximum Specificity */
    ::ng-deep .modern-player-select,
    ::ng-deep .modern-vote-select {
      min-width: 160px !important;
      flex: 1 !important;
    }

    ::ng-deep .modern-player-select .mat-mdc-form-field-infix,
    ::ng-deep .modern-vote-select .mat-mdc-form-field-infix {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
      border: 2px solid #e2e8f0 !important;
      border-radius: 12px !important;
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      padding: 12px 16px !important;
      min-height: 48px !important;
    }

    ::ng-deep .modern-player-select:hover .mat-mdc-form-field-infix,
    ::ng-deep .modern-vote-select:hover .mat-mdc-form-field-infix {
      border-color: #667eea !important;
      box-shadow: 
        0 8px 25px -5px rgba(102, 126, 234, 0.25),
        0 4px 6px -2px rgba(102, 126, 234, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
      transform: translateY(-2px) !important;
    }

    ::ng-deep .modern-player-select.mat-focused .mat-mdc-form-field-infix,
    ::ng-deep .modern-vote-select.mat-focused .mat-mdc-form-field-infix {
      border-color: #667eea !important;
      box-shadow: 
        0 0 0 4px rgba(102, 126, 234, 0.15),
        0 8px 25px -5px rgba(102, 126, 234, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
      transform: translateY(-3px) !important;
    }

    /* Hide Angular Material default styling */
    ::ng-deep .modern-player-select .mat-mdc-form-field-underline,
    ::ng-deep .modern-vote-select .mat-mdc-form-field-underline,
    ::ng-deep .modern-player-select .mat-mdc-form-field-subscript-wrapper,
    ::ng-deep .modern-vote-select .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }

    ::ng-deep .modern-player-select .mdc-notched-outline,
    ::ng-deep .modern-vote-select .mdc-notched-outline {
      display: none !important;
    }

    /* Labels */
    ::ng-deep .modern-player-select .mat-mdc-form-field-label,
    ::ng-deep .modern-vote-select .mat-mdc-form-field-label {
      color: #667eea !important;
      font-weight: 600 !important;
      font-size: 12px !important;
      transform: translateY(-24px) scale(0.85) !important;
      background: white !important;
      padding: 0 4px !important;
      border-radius: 4px !important;
    }

    /* Select Content */
    ::ng-deep .modern-player-select .mat-mdc-select-value,
    ::ng-deep .modern-vote-select .mat-mdc-select-value {
      color: #1a202c !important;
      font-weight: 600 !important;
      font-size: 14px !important;
    }

    ::ng-deep .modern-player-select .mat-mdc-select-placeholder,
    ::ng-deep .modern-vote-select .mat-mdc-select-placeholder {
      color: #a0aec0 !important;
      font-weight: 500 !important;
      font-size: 14px !important;
    }

    /* Select Arrow */
    ::ng-deep .modern-player-select .mat-mdc-select-arrow,
    ::ng-deep .modern-vote-select .mat-mdc-select-arrow {
      color: #667eea !important;
      font-size: 20px !important;
      transition: all 0.3s ease !important;
    }

    ::ng-deep .modern-player-select:hover .mat-mdc-select-arrow,
    ::ng-deep .modern-vote-select:hover .mat-mdc-select-arrow {
      color: #5a67d8 !important;
      transform: rotate(180deg) !important;
    }

    /* Placeholder and italic text styling */
    .placeholder-text, em {
      color: rgba(0, 0, 0, 0.6) !important;
      font-style: italic !important;
      font-size: 14px !important;
    }

    /* Ultra-Premium Add Vote Button */
    .modern-add-vote-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      position: relative !important;
      color: white !important;
      border: none !important;
      border-radius: 12px !important;
      font-weight: 700 !important;
      font-size: 14px !important;
      text-transform: none !important;
      letter-spacing: 0.5px !important;
      padding: 0 24px !important;
      height: 48px !important;
      min-width: 140px !important;
      box-shadow: 
        0 4px 6px -1px rgba(102, 126, 234, 0.5),
        0 2px 4px -1px rgba(102, 126, 234, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      overflow: hidden !important;
      margin-left: 8px !important;
    }

    .modern-add-vote-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s;
    }

    .modern-add-vote-btn:hover {
      transform: translateY(-3px) scale(1.02) !important;
      box-shadow: 
        0 10px 25px -3px rgba(102, 126, 234, 0.6),
        0 6px 10px -2px rgba(102, 126, 234, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
      background: linear-gradient(135deg, #5a67d8 0%, #667eea 50%, #764ba2 100%) !important;
    }

    .modern-add-vote-btn:hover::before {
      left: 100%;
    }

    .modern-add-vote-btn:active {
      transform: translateY(-1px) scale(0.98) !important;
      box-shadow: 
        0 4px 6px -1px rgba(102, 126, 234, 0.5),
        0 2px 4px -1px rgba(102, 126, 234, 0.3) !important;
    }

    .modern-add-vote-btn:disabled {
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%) !important;
      color: #a0aec0 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      transform: none !important;
      cursor: not-allowed !important;
    }

    /* Button Icon Enhancement */
    .modern-add-vote-btn mat-icon {
      margin-right: 8px !important;
      font-size: 16px !important;
    }

    /* Ultra-Premium Select Dropdown Panel */
    ::ng-deep .mat-mdc-select-panel {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
      border: 2px solid rgba(102, 126, 234, 0.1) !important;
      border-radius: 16px !important;
      box-shadow: 
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04),
        0 0 0 1px rgba(102, 126, 234, 0.05) !important;
      margin-top: 8px !important;
      padding: 8px !important;
      backdrop-filter: blur(10px) !important;
    }

    ::ng-deep .mat-mdc-option {
      color: #1a202c !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      padding: 12px 16px !important;
      margin: 2px 0 !important;
      border-radius: 10px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative !important;
      overflow: hidden !important;
    }

    ::ng-deep .mat-mdc-option::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
      transition: left 0.6s;
    }

    ::ng-deep .mat-mdc-option:hover {
      background: linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%) !important;
      color: #667eea !important;
      transform: translateX(4px) !important;
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.15) !important;
    }

    ::ng-deep .mat-mdc-option:hover::before {
      left: 100%;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--selected {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3) !important;
      transform: scale(1.02) !important;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--selected::after {
      content: '✓';
      position: absolute;
      right: 12px;
      font-weight: 700;
      font-size: 16px;
    }

    /* Enhanced Focus States */
    ::ng-deep .mat-mdc-option.mdc-list-item--focused {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%) !important;
      color: #667eea !important;
    }

    /* Dropdown Animation */
    ::ng-deep .mat-mdc-select-panel {
      animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Global Modal Styles */
    :host ::ng-deep .modern-dialog-panel {
      border-radius: 24px !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    :host ::ng-deep .modern-dialog-backdrop {
      background: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(8px) !important;
    }

    :host ::ng-deep .cdk-overlay-pane {
      border-radius: 24px !important;
    }

  `]
})
export class AdminPollManagementComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;
  private subscriptions = new Subscription();

  selectedTab = 0;
  loading = false;
  creatingEvent = false;
  generatingMatches = false;

  openPlayEvents: OpenPlayEvent[] = [];
  generatedMatches: any[] = [];
  activeTraditionalPolls: any[] = [];
  draftPolls: any[] = [];
  polls: any[] = [];
  members: any[] = [];
  openPlayForm: FormGroup;
  expandedEventId: string | null = null;
  selectedPlayerId: string = '';
  selectedVoteOption: string = '';

  // Match results properties
  selectedEvent: OpenPlayEvent | null = null;
  eventMatches: any[] = [];
  recordingResult = false;

  timeSlots = [
    { value: 5, display: '5:00 AM' },
    { value: 6, display: '6:00 AM' },
    { value: 7, display: '7:00 AM' },
    { value: 8, display: '8:00 AM' },
    { value: 9, display: '9:00 AM' },
    { value: 10, display: '10:00 AM' },
    { value: 11, display: '11:00 AM' },
    { value: 12, display: '12:00 PM' },
    { value: 13, display: '1:00 PM' },
    { value: 14, display: '2:00 PM' },
    { value: 15, display: '3:00 PM' },
    { value: 16, display: '4:00 PM' },
    { value: 17, display: '5:00 PM' },
    { value: 18, display: '6:00 PM' },
    { value: 19, display: '7:00 PM' },
    { value: 20, display: '8:00 PM' },
    { value: 21, display: '9:00 PM' },
    { value: 22, display: '10:00 PM' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.openPlayForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      tournamentTier: ['100', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    }, { validators: this.timeRangeValidator });
  }

  async ngOnInit(): Promise<void> {
    await this.loadMembers();
    this.loadOpenPlayEvents();
    this.loadTraditionalPolls();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadMembers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiUrl}/members?limit=100&includeAll=true`).subscribe({
        next: (response) => {
          if (response && response.success && response.data) {
            this.members = response.data;
            console.log('🔍 Frontend: Loaded', this.members.length, 'members');
            if (this.members.length > 0) {
              console.log('🔍 Sample member structure:', this.members[0]);
              console.log('🔍 First 5 member IDs:', this.members.slice(0, 5).map(m => ({id: m._id, name: m.fullName})));
            }
            resolve();
          } else {
            reject('Failed to load members');
          }
        },
        error: (error) => {
          console.error('Error loading members:', error);
          reject(error);
        }
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  async refreshData(): Promise<void> {
    this.loadOpenPlayEvents();
    await this.loadGeneratedMatches();
  }

  async onTabChange(event: any): Promise<void> {
    console.log('🔍 Tab changed to index:', event.index);
    this.selectedTab = event.index;
    if (event.index === 3) { // Match Management tab (0: Club Polls, 1: Open Play Events, 2: Create Open Play, 3: Match Management, 4: Record Results)
      console.log('🔍 Match Management tab selected, loading matches...');
      await this.loadGeneratedMatches();
    } else if (event.index === 4) { // Record Results tab
      console.log('🔍 Record Results tab selected, loading matches for recording...');
      if (this.selectedEvent) {
        await this.loadGeneratedMatches();
      }
    } else {
      console.log('🔍 Other tab selected, skipping match loading');
    }
  }

  loadOpenPlayEvents(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/polls/open-play`).subscribe({
      next: async (response) => {
        this.openPlayEvents = response.data || [];
        
        // Backend should already populate player names, but we have fallback in getPlayerDisplayName
        // await this.resolvePlayerNamesForEvents(this.openPlayEvents);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading Open Play events:', error);
        this.snackBar.open('Failed to load Open Play events', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private async resolvePlayerNamesForEvents(events: OpenPlayEvent[]): Promise<void> {
    // Collect all unique player IDs from all events
    const allPlayerIds = new Set<string>();
    
    events.forEach(event => {
      if (event.openPlayEvent?.matches) {
        event.openPlayEvent.matches.forEach(match => {
          if (match.players) {
            match.players.forEach(player => {
              if (typeof player === 'string') {
                allPlayerIds.add(player);
              }
            });
          }
        });
      }
    });

    if (allPlayerIds.size === 0) return;

    // Fetch all users in one request (with high limit to get all members)
    try {
      console.log('🔍 Frontend: Fetching members to resolve', allPlayerIds.size, 'player IDs:', Array.from(allPlayerIds).slice(0, 3));
      const memberResponse = await this.http.get<any>(`${this.apiUrl}/members?limit=100&includeAll=true`).toPromise();
      console.log('🔍 Frontend: Member response:', memberResponse?.success, 'members count:', memberResponse?.data?.length);
      
      if (memberResponse && memberResponse.success && memberResponse.data) {
        const playerMap: Record<string, any> = {};
        
        // Create a map of user ID to user data
        memberResponse.data.forEach((user: any) => {
          if (allPlayerIds.has(user._id)) {
            playerMap[user._id] = {
              _id: user._id,
              username: user.username,
              fullName: user.fullName
            };
            console.log('🔍 Frontend: Mapped player:', user._id, '->', user.fullName || user.username);
          }
        });
        
        console.log('🔍 Frontend: Created player map with', Object.keys(playerMap).length, 'entries');
        console.log('🔍 Frontend: Missing players:', Array.from(allPlayerIds).filter(id => !playerMap[id]));

        // Replace player IDs with player objects
        events.forEach(event => {
          if (event.openPlayEvent?.matches) {
            event.openPlayEvent.matches.forEach(match => {
              if (match.players) {
                console.log('🔍 Frontend: Match before replacement:', match.players);
                match.players = match.players.map(player => {
                  if (typeof player === 'string' && playerMap[player]) {
                    console.log('🔍 Frontend: Replacing', player, 'with', playerMap[player].fullName);
                    return playerMap[player];
                  }
                  console.log('🔍 Frontend: Keeping', player, 'as is (not found in map)');
                  return player;
                });
                console.log('🔍 Frontend: Match after replacement:', match.players.map((p: any) => typeof p === 'object' ? p.fullName : p));
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch member data for player resolution:', error);
    }
  }

  async loadGeneratedMatches(): Promise<void> {
    // Ensure members are loaded first
    if (!this.members || this.members.length === 0) {
      console.log('🔍 Members not loaded, loading members first...');
      try {
        await this.loadMembers();
        console.log('🔍 Members loaded successfully:', this.members.length, 'members');
      } catch (error) {
        console.error('🔍 Failed to load members:', error);
        return;
      }
    } else {
      console.log('🔍 Members already loaded:', this.members.length, 'members');
    }
    
    // Load events with generated matches
    this.http.get<any>(`${this.apiUrl}/polls/open-play`).subscribe({
      next: async (response) => {
        const events = response.data || [];
        this.generatedMatches = events
          .filter((event: any) => {
            const hasMatches = event.openPlayEvent?.matchesGenerated && event.openPlayEvent?.matches?.length > 0;
            return hasMatches;
          })
          .map((event: any) => ({
            eventId: event._id,
            eventTitle: event.title,
            eventDate: event.openPlayEvent.eventDate,
            startTime: event.openPlayEvent.startTime,
            endTime: event.openPlayEvent.endTime,
            matches: event.openPlayEvent.matches,
            modified: false
          }));

        console.log('🔍 Generated matches loaded:', this.generatedMatches.length, 'events');
        if (this.generatedMatches.length > 0) {
          console.log('🔍 First event matches count:', this.generatedMatches[0].matches?.length);
          console.log('🔍 Sample match:', this.generatedMatches[0].matches?.[0]);
        }
          
        
        // Resolve player names for all generated matches
        await this.resolvePlayerNamesForMatches();
      },
      error: (error) => {
        console.error('Error loading generated matches:', error);
      }
    });
  }

  private async resolvePlayerNamesForMatches(): Promise<void> {
    // Same logic as resolvePlayerNamesForEvents but for generated matches
    const allPlayerIds = new Set<string>();
    
    this.generatedMatches.forEach(matchSet => {
      if (matchSet.matches) {
        matchSet.matches.forEach(match => {
          if (match.players) {
            match.players.forEach(player => {
              if (typeof player === 'string') {
                allPlayerIds.add(player);
              }
            });
          }
        });
      }
    });

    if (allPlayerIds.size === 0) return;

    try {
      const memberResponse = await this.http.get<any>(`${this.apiUrl}/members`).toPromise();
      if (memberResponse && memberResponse.success && memberResponse.data) {
        const playerMap: Record<string, any> = {};
        
        memberResponse.data.forEach((user: any) => {
          if (allPlayerIds.has(user._id)) {
            playerMap[user._id] = {
              _id: user._id,
              username: user.username,
              fullName: user.fullName
            };
          }
        });

        // Replace player IDs with player objects
        this.generatedMatches.forEach(matchSet => {
          if (matchSet.matches) {
            matchSet.matches.forEach(match => {
              if (match.players) {
                match.players = match.players.map(player => {
                  if (typeof player === 'string' && playerMap[player]) {
                    return playerMap[player];
                  }
                  return player;
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch member data for player resolution:', error);
    }
  }

  createOpenPlay(): void {
    if (this.openPlayForm.invalid) {
      return;
    }

    this.creatingEvent = true;
    const formValue = this.openPlayForm.value;

    const payload = {
      eventDate: formValue.eventDate,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      title: formValue.title,
      description: formValue.description,
      tournamentTier: formValue.tournamentTier
    };

    this.http.post<any>(`${this.apiUrl}/polls/open-play`, payload).subscribe({
      next: (response) => {
        this.snackBar.open('Open Play event created successfully! All members have been notified.', 'Close', { 
          duration: 5000 
        });
        this.resetForm();
        this.loadOpenPlayEvents();
        this.notificationService.refreshNotifications(); // Refresh notifications
        this.selectedTab = 0; // Switch to events tab
        this.creatingEvent = false;
      },
      error: (error) => {
        console.error('Error creating Open Play event:', error);
        this.snackBar.open('Failed to create Open Play event', 'Close', { duration: 3000 });
        this.creatingEvent = false;
      }
    });
  }

  generateMatches(eventId: string): void {
    this.generatingMatches = true;
    
    this.http.post<any>(`${this.apiUrl}/polls/${eventId}/generate-matches`, {}).subscribe({
      next: async (response) => {
        this.snackBar.open('Matches generated successfully!', 'Close', { duration: 3000 });
        this.loadOpenPlayEvents();
        await this.loadGeneratedMatches();
        this.generatingMatches = false;
      },
      error: (error) => {
        console.error('Error generating matches:', error);
        this.snackBar.open('Failed to generate matches', 'Close', { duration: 3000 });
        this.generatingMatches = false;
      }
    });
  }

  viewEventDetails(event: OpenPlayEvent): void {
    // Navigate to detailed event view
    this.router.navigate(['/polls', event._id]);
  }

  async viewMatches(event: OpenPlayEvent): Promise<void> {
    this.selectedTab = 3; // Switch to Match Management tab (index 3)
    await this.loadGeneratedMatches();
  }

  resetForm(): void {
    this.openPlayForm.reset();
  }

  formatEventDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  timeRangeValidator(group: any) {
    const startTime = group.get('startTime')?.value;
    const endTime = group.get('endTime')?.value;
    
    if (startTime && endTime && endTime <= startTime) {
      group.get('endTime')?.setErrors({ invalidRange: true });
      return { invalidRange: true };
    }
    
    return null;
  }

  getValidEndTimes() {
    const startTime = this.openPlayForm.get('startTime')?.value;
    if (!startTime) {
      return this.timeSlots;
    }
    
    return this.timeSlots.filter(slot => slot.value > startTime);
  }

  formatTimeRange(startTime: number, endTime: number): string {
    const start = this.timeSlots.find(t => t.value === startTime)?.display || `${startTime}:00`;
    const end = this.timeSlots.find(t => t.value === endTime)?.display || `${endTime}:00`;
    return `${start} - ${end}`;
  }

  getStatusIcon(status: string): { icon: string, class: string } {
    switch (status) {
      case 'active':
        return { icon: 'play_circle', class: 'status-active' };
      case 'closed':
        return { icon: 'check_circle', class: 'status-closed' };
      case 'draft':
        return { icon: 'edit', class: 'status-draft' };
      default:
        return { icon: 'help', class: '' };
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
      // Show a placeholder
      return `Player (${player.substring(0, 8)}...)`;
    } else if (typeof player === 'object' && player) {
      // Player is a populated object
      return player.fullName || player.username || 'Player';
    }
    return 'Unknown Player';
  }

  getTotalVoters(event: any): number {
    return event.options.reduce((total: number, option: any) => {
      return total + (option.voters ? option.voters.length : 0);
    }, 0);
  }

  // Drag and drop functionality - swap matches only
  dropMatch(event: CdkDragDrop<any[]>, matchSet: any): void {
    if (event.previousIndex !== event.currentIndex) {
      this.swapMatches(matchSet, event.previousIndex, event.currentIndex);
    }
  }

  // Swap matches using button controls
  swapMatches(matchSet: any, index1: number, index2: number): void {
    if (index1 === index2 || index1 < 0 || index2 < 0 || 
        index1 >= matchSet.matches.length || index2 >= matchSet.matches.length) {
      return;
    }

    // Create copies to avoid reference issues
    const match1 = { ...matchSet.matches[index1] };
    const match2 = { ...matchSet.matches[index2] };
    
    // Swap the match numbers
    const tempMatchNumber = match1.matchNumber;
    match1.matchNumber = match2.matchNumber;
    match2.matchNumber = tempMatchNumber;
    
    // Create new array with swapped matches to trigger change detection
    const updatedMatches = [...matchSet.matches];
    updatedMatches[index1] = match2;
    updatedMatches[index2] = match1;
    
    // Update the matchSet with new array
    matchSet.matches = updatedMatches;
    
    // Mark as modified
    matchSet.modified = true;
    
    console.log(`🔄 Swapped Match ${tempMatchNumber} ↔ Match ${match2.matchNumber}`);
  }

  saveMatchOrder(matchSet: any): void {
    // Create the request payload with the new match order
    const payload = {
      matches: matchSet.matches.map((match: any, index: number) => {
        const players = match.players.map((player: any) => 
          typeof player === 'object' ? player._id : player
        );
        
        const team1 = match.team1 && match.team1.length === 2 ? 
          match.team1.map((player: any) => typeof player === 'object' ? player._id : player) : 
          [players[0], players[1]];
          
        const team2 = match.team2 && match.team2.length === 2 ? 
          match.team2.map((player: any) => typeof player === 'object' ? player._id : player) : 
          [players[2], players[3]];

        console.log(`🔍 Frontend Match ${index + 1} payload:`, {
          court: match.court,
          matchNumber: index + 1,
          players: players,
          team1: team1,
          team2: team2,
          originalMatch: match
        });

        return {
          court: match.court,
          matchNumber: index + 1,
          players: players,
          team1: team1,
          team2: team2,
          status: match.status || 'scheduled'
        };
      })
    };

    console.log('🔍 Full payload being sent:', payload);

    this.http.put<any>(`${this.apiUrl}/polls/${matchSet.eventId}/matches-order`, payload).subscribe({
      next: (response) => {
        this.snackBar.open('Match order saved successfully', 'Close', { duration: 3000 });
        matchSet.modified = false;
      },
      error: (error) => {
        console.error('Error saving match order:', error);
        this.snackBar.open('Failed to save match order', 'Close', { duration: 3000 });
      }
    });
  }

  async resetMatchOrder(matchSet: any): Promise<void> {
    // Reset to original order by reloading the data
    await this.loadGeneratedMatches();
  }

  // Vote management methods
  toggleVoteManagement(eventId: string): void {
    this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
    // Reset form when toggling to ensure clean state
    this.selectedPlayerId = '';
    this.selectedVoteOption = '';
  }


  getAvailablePlayers(event: OpenPlayEvent): any[] {
    // Get all players who haven't voted yet
    const allVoters = new Set();
    event.options.forEach(option => {
      option.voters.forEach(voter => allVoters.add(voter));
    });
    
    return this.members.filter(member => !allVoters.has(member._id));
  }

  addVote(eventId: string, voteOption: string, playerId: string): void {
    if (!eventId || !voteOption || !playerId || voteOption === '' || playerId === '') {
      this.snackBar.open('Please select both player and vote option', 'Close', { duration: 3000 });
      return;
    }

    const payload = {
      optionText: voteOption,
      userId: playerId
    };

    this.http.post<any>(`${this.apiUrl}/polls/${eventId}/admin-vote`, payload).subscribe({
      next: (response) => {
        this.snackBar.open('Vote added successfully', 'Close', { duration: 3000 });
        // Reset selections
        this.selectedPlayerId = '';
        this.selectedVoteOption = '';
        this.loadOpenPlayEvents();
      },
      error: (error) => {
        console.error('Error adding vote:', error);
        this.snackBar.open('Failed to add vote', 'Close', { duration: 3000 });
      }
    });
  }

  removeVote(eventId: string, voteOption: string, playerId: string): void {
    const payload = {
      optionText: voteOption,
      userId: playerId
    };

    this.http.delete<any>(`${this.apiUrl}/polls/${eventId}/admin-vote`, { body: payload }).subscribe({
      next: (response) => {
        this.snackBar.open('Vote removed successfully', 'Close', { duration: 3000 });
        this.loadOpenPlayEvents();
      },
      error: (error) => {
        console.error('Error removing vote:', error);
        this.snackBar.open('Failed to remove vote', 'Close', { duration: 3000 });
      }
    });
  }

  // Match Results Recording Methods
  recordMatchResults(event: OpenPlayEvent): void {
    this.selectedEvent = event;
    this.selectedTab = 4; // Switch to Record Results tab
    // Ensure members are loaded before loading matches
    if (!this.members || this.members.length === 0) {
      this.loadMembers();
    }
    this.loadEventMatches(event._id);
  }

  loadEventMatches(pollId: string): void {
    this.eventMatches = [];
    this.http.get<any>(`${this.apiUrl}/matches/open-play/${pollId}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.eventMatches = response.data.matches.map((match: any) => ({
            ...match,
            tempScore: match.score || ''
          }));
          console.log('🔍 Loaded', this.eventMatches.length, 'matches');
          if (this.eventMatches.length > 0) {
            console.log('🔍 First match structure:', this.eventMatches[0]);
            console.log('🔍 DEBUGGING: First match players:', this.eventMatches[0].players);
            console.log('🔍 DEBUGGING: Members available:', this.members?.length || 'NONE');
            if (this.members && this.members.length > 0) {
              console.log('🔍 DEBUGGING: Sample member IDs:', this.members.slice(0, 3).map(m => m._id));
              
              // Test if any match player IDs exist in members
              const firstMatchPlayers = this.eventMatches[0].players || [];
              console.log('🔍 DEBUGGING: Testing player ID matches:');
              firstMatchPlayers.slice(0, 2).forEach((playerId: string) => {
                const found = this.members.find(m => m._id === playerId);
                console.log(`  Player ${playerId} found:`, found ? found.fullName : 'NOT FOUND');
              });
            }
          }
        }
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.snackBar.open('Failed to load matches', 'Close', { duration: 3000 });
      }
    });
  }

  recordWinner(match: any, winningTeam: 1 | 2): void {
    if (!this.selectedEvent) return;

    this.recordingResult = true;
    const payload = {
      winningTeam: winningTeam,
      score: match.tempScore || undefined
    };

    this.http.post<any>(`${this.apiUrl}/matches/open-play/${this.selectedEvent._id}/${match.matchNumber}/result`, payload).subscribe({
      next: (response) => {
        if (response.success) {
          match.winningTeam = winningTeam;
          match.score = match.tempScore;
          match.status = 'completed';
          
          const scoreText = match.tempScore ? ` (Score: ${match.tempScore})` : '';
          this.snackBar.open(`Match result recorded and points awarded!${scoreText}`, 'Close', { duration: 5000 });
        }
        this.recordingResult = false;
      },
      error: (error) => {
        console.error('Error recording match result:', error);
        this.snackBar.open('Failed to record match result', 'Close', { duration: 3000 });
        this.recordingResult = false;
      }
    });
  }

  editResult(match: any): void {
    match.status = 'scheduled';
    match.winningTeam = null;
    match.tempScore = match.score || '';
  }

  getPlayerName(player: any): string {
    // Handle both populated player objects and string IDs
    if (typeof player === 'object' && player) {
      // Player is already populated by backend
      return player.fullName || player.username || 'Player';
    } else if (typeof player === 'string') {
      // Player is just an ID string, try to find in our cached members
      const member = this.members.find(m => m._id === player);
      return member ? (member.fullName || member.username || 'Player') : 'Unknown Player';
    }
    return 'Unknown Player';
  }

  getTeamName(team: any[]): string {
    if (!team || team.length === 0) {
      return 'Empty Team';
    }
    
    console.log('🔍 getTeamName called with team:', team);
    console.log('🔍 Members available:', this.members?.length || 0);
    
    const playerNames = team.map(player => {
      console.log('🔍 Processing player:', player, typeof player);
      
      // Handle populated player objects first
      if (typeof player === 'object' && player) {
        const name = player.fullName || player.username || 'Player';
        console.log('🔍 Using populated player name:', name);
        return name.split(' ')[0]; // Use first name only for team display
      }
      
      // Handle string IDs - try to find in cached members
      if (typeof player === 'string') {
        // If members data isn't loaded yet, return a placeholder
        if (!this.members || this.members.length === 0) {
          return 'Loading';
        }
        
        // Try multiple ways to find the member
        let member = this.members.find(m => m._id === player);
        if (!member) {
          member = this.members.find(m => m.id === player);
        }
        if (!member) {
          member = this.members.find(m => String(m._id) === String(player));
        }
        
        console.log('🔍 Found member:', member ? {id: member._id, name: member.fullName} : 'NOT FOUND');
        
        const name = member ? (member.fullName || member.username || 'Player') : 'Unknown';
        return name.split(' ')[0]; // Use first name only for team display
      }
      
      return 'Unknown';
    });
    
    const result = playerNames.join(' & ');
    console.log('🔍 Final team name:', result);
    return result;
  }

  // Helper method to get team from match data, with fallback to players array
  getTeamFromMatch(match: any, teamNumber: 1 | 2): any[] {
    // Try to get from team1/team2 first (these may be populated player objects)
    const team = teamNumber === 1 ? match.team1 : match.team2;
    if (team && team.length > 0) {
      return team;
    }
    
    // Fallback to players array (split 4 players into 2 teams)
    if (match.players && match.players.length === 4) {
      if (teamNumber === 1) {
        return [match.players[0], match.players[1]];
      } else {
        return [match.players[2], match.players[3]];
      }
    }
    
    return [];
  }

  getTeamDisplayName(players: any[]): string {
    if (!players || players.length === 0) {
      return 'Team';
    }
    const playerNames = players.map(player => {
      // Handle populated player objects first
      if (typeof player === 'object' && player) {
        const name = player.fullName || player.username || 'Player';
        return name.split(' ')[0]; // Use first name only
      }
      // Handle string IDs
      if (typeof player === 'string') {
        const member = this.members.find(m => m._id === player);
        const name = member ? (member.fullName || member.username || 'Player') : 'Unknown';
        return name.split(' ')[0]; // Use first name only
      }
      return 'Unknown';
    });
    return playerNames.join(' & ');
  }

  getMatchStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'completed-icon';
      case 'in_progress': return 'in-progress-icon';
      default: return 'scheduled-icon';
    }
  }

  getCompletedMatches(): any[] {
    return this.eventMatches.filter(match => match.status === 'completed');
  }

  getTierPoints(): { winner: number; participant: number } {
    if (!this.selectedEvent) return { winner: 0, participant: 0 };
    
    const tierPoints = {
      '100': { winner: 10, participant: 5 },
      '250': { winner: 25, participant: 15 },
      '500': { winner: 50, participant: 30 }
    };
    
    return tierPoints[this.selectedEvent.openPlayEvent.tournamentTier] || { winner: 0, participant: 0 };
  }

  // Traditional Polls Management Methods
  loadTraditionalPolls(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/polls`).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.polls = response.data || [];
          // Separate traditional polls from open play events
          this.activeTraditionalPolls = this.polls.filter(poll => 
            poll.status === 'active' && poll.metadata?.category !== 'open_play'
          );
          this.draftPolls = this.polls.filter(poll => 
            poll.status === 'draft' && poll.metadata?.category !== 'open_play'
          );
          console.log('Traditional polls loaded:', {
            active: this.activeTraditionalPolls.length,
            draft: this.draftPolls.length
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading traditional polls:', error);
        this.showMessage('Error loading polls', 'error');
        this.loading = false;
      }
    });
  }

  getAllTraditionalPolls(): any[] {
    return [...this.activeTraditionalPolls, ...this.draftPolls];
  }

  getTotalVotes(): number {
    return this.activeTraditionalPolls.reduce((total, poll) => {
      return total + poll.options.reduce((pollTotal: number, option: any) => 
        pollTotal + option.votes, 0);
    }, 0);
  }

  getTotalPollVotes(poll: any): number {
    return poll.options.reduce((total: number, option: any) => total + option.votes, 0);
  }

  getPollOptionPercentage(poll: any, option: any): number {
    const totalVotes = this.getTotalPollVotes(poll);
    if (totalVotes === 0) return 0;
    return Math.round((option.votes / totalVotes) * 100);
  }

  getPollCategoryClass(category: string): string {
    const classMap: Record<string, string> = {
      'club_policy': 'club-policy',
      'facility': 'facility',
      'general': 'general'
    };
    return classMap[category] || 'general';
  }

  getPollCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'club_policy': 'policy',
      'facility': 'business',
      'general': 'forum'
    };
    return iconMap[category] || 'poll';
  }

  getCategoryLabel(category: string): string {
    const labelMap: Record<string, string> = {
      'club_policy': 'Club Policy',
      'facility': 'Facility',
      'general': 'General',
      'open_play': 'Open Play'
    };
    return labelMap[category] || category;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Poll Management Actions
  createNewPoll(): void {
    this.snackBar.open('Poll creation dialog will be implemented', 'Close', { duration: 3000 });
    // TODO: Open poll creation dialog
  }

  viewPollDetails(poll: any): void {
    this.snackBar.open('Poll details view will be implemented', 'Close', { duration: 3000 });
    // TODO: Open poll details dialog
  }

  editPoll(poll: any): void {
    this.snackBar.open(`Edit poll: ${poll.title}`, 'Close', { duration: 3000 });
    // TODO: Open poll edit dialog
  }

  closePoll(poll: any): void {
    const eventType = poll.metadata?.category === 'open_play' ? 'Open Play Event' : 'Poll';
    const confirmedCount = poll.options?.find((opt: any) => opt.text?.toLowerCase() === 'yes')?.votes || 0;
    
    const modalData: CloseEventModalData = {
      eventTitle: poll.title,
      eventType: eventType,
      confirmedPlayerCount: confirmedCount
    };

    const dialogRef = this.dialog.open(CloseEventModalComponent, {
      width: '540px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog-panel',
      data: modalData,
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'modern-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post(`${this.apiUrl}/polls/${poll._id}/close`, {}).subscribe({
          next: (response) => {
            this.snackBar.open(`${eventType} closed successfully`, 'Close', { 
              duration: 4000,
              panelClass: 'snackbar-success'
            });
            this.loadTraditionalPolls();
          },
          error: (error) => {
            console.error(`Error closing ${eventType}:`, error);
            this.snackBar.open(`Error closing ${eventType}`, 'Close', { 
              duration: 4000,
              panelClass: 'snackbar-error'
            });
          }
        });
      }
    });
  }

  closeOpenPlayEvent(event: any): void {
    const confirmedCount = event.openPlayEvent?.confirmedPlayers?.length || 0;
    const eventType = event.openPlayEvent ? 'Open Play Event' : 'Poll';
    
    // Format event date and time for display
    const eventDate = event.openPlayEvent?.eventDate 
      ? new Date(event.openPlayEvent.eventDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        })
      : undefined;
      
    const eventTime = (event.openPlayEvent?.startTime && event.openPlayEvent?.endTime)
      ? `${this.formatTimeSlot(event.openPlayEvent.startTime)} - ${this.formatTimeSlot(event.openPlayEvent.endTime)}`
      : undefined;
    
    const modalData: CloseEventModalData = {
      eventTitle: event.title,
      eventType: eventType,
      confirmedPlayerCount: confirmedCount,
      eventDate: eventDate,
      eventTime: eventTime
    };

    const dialogRef = this.dialog.open(CloseEventModalComponent, {
      width: '540px',
      maxWidth: '95vw',
      panelClass: 'modern-dialog-panel',
      data: modalData,
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'modern-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post(`${this.apiUrl}/polls/${event._id}/close`, {}).subscribe({
          next: (response) => {
            this.snackBar.open(`${eventType} closed successfully`, 'Close', { 
              duration: 4000,
              panelClass: 'snackbar-success'
            });
            this.loadOpenPlayEvents();
          },
          error: (error) => {
            console.error(`Error closing ${eventType}:`, error);
            this.snackBar.open(`Error closing ${eventType}`, 'Close', { 
              duration: 4000,
              panelClass: 'snackbar-error'
            });
          }
        });
      }
    });
  }

  private formatTimeSlot(timeSlot: number): string {
    const time = timeSlot;
    const suffix = time >= 12 ? 'PM' : 'AM';
    const displayTime = time > 12 ? time - 12 : time;
    return `${displayTime}:00 ${suffix}`;
  }

  activatePoll(poll: any): void {
    this.http.post(`${this.apiUrl}/polls/${poll._id}/activate`, {}).subscribe({
      next: (response) => {
        this.snackBar.open('Poll activated successfully', 'Close', { duration: 3000 });
        this.loadTraditionalPolls();
      },
      error: (error) => {
        console.error('Error activating poll:', error);
        this.snackBar.open('Error activating poll', 'Close', { duration: 3000 });
      }
    });
  }

  deletePoll(poll: any): void {
    if (confirm(`Are you sure you want to delete the poll "${poll.title}"? This action cannot be undone.`)) {
      this.http.delete(`${this.apiUrl}/polls/${poll._id}`).subscribe({
        next: (response) => {
          this.snackBar.open('Poll deleted successfully', 'Close', { duration: 3000 });
          this.loadTraditionalPolls();
        },
        error: (error) => {
          console.error('Error deleting poll:', error);
          this.snackBar.open('Error deleting poll', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    const config = {
      duration: 4000,
      panelClass: [`snackbar-${type}`]
    };
    this.snackBar.open(message, 'Close', config);
  }

  getEventStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'closed':
        return 'status-closed';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  getEventStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'play_circle';
      case 'closed':
        return 'pause_circle';
      case 'completed':
        return 'check_circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'schedule';
    }
  }
}