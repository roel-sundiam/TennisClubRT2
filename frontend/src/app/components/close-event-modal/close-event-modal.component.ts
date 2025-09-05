import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CloseEventModalData {
  eventTitle: string;
  eventType: string;
  confirmedPlayerCount: number;
  eventDate?: string;
  eventTime?: string;
}

@Component({
  selector: 'app-close-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="modern-modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-icon">
          <mat-icon>warning</mat-icon>
        </div>
        <h2 class="modal-title">Close {{data.eventType}}</h2>
        <button mat-icon-button 
                class="close-button" 
                (click)="onCancel()" 
                matTooltip="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <div class="event-info-section">
          <div class="event-title-section">
            <mat-icon class="event-icon">event</mat-icon>
            <div class="event-details">
              <h3 class="event-name">{{data.eventTitle}}</h3>
              <div class="event-meta" *ngIf="data.eventDate || data.eventTime">
                <span *ngIf="data.eventDate" class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  {{data.eventDate}}
                </span>
                <span *ngIf="data.eventTime" class="meta-item">
                  <mat-icon>access_time</mat-icon>
                  {{data.eventTime}}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="confirmation-section">
          <div class="warning-message">
            <div class="warning-icon">
              <mat-icon>info</mat-icon>
            </div>
            <div class="warning-text">
              <h4>Are you sure you want to close this {{data.eventType.toLowerCase()}}?</h4>
              <p>This action cannot be undone. Once closed, the event will be moved to the past events archive.</p>
            </div>
          </div>

          <div class="impact-summary" *ngIf="data.confirmedPlayerCount > 0">
            <div class="impact-header">
              <mat-icon>groups</mat-icon>
              <span class="impact-title">Impact Summary</span>
            </div>
            <div class="impact-details">
              <div class="impact-item">
                <div class="impact-stat">
                  <span class="stat-number">{{data.confirmedPlayerCount}}</span>
                  <span class="stat-label">{{data.confirmedPlayerCount === 1 ? 'Player' : 'Players'}}</span>
                </div>
                <span class="impact-description">will be notified that the event has been closed</span>
              </div>
            </div>
          </div>

          <div class="consequences-list">
            <h5 class="consequences-title">What happens next?</h5>
            <ul class="consequences">
              <li>
                <mat-icon>check_circle</mat-icon>
                <span>Event status will be changed to "Closed"</span>
              </li>
              <li>
                <mat-icon>archive</mat-icon>
                <span>Event will appear in "Past Open Plays" section</span>
              </li>
              <li *ngIf="data.confirmedPlayerCount > 0">
                <mat-icon>notifications</mat-icon>
                <span>All registered players will receive a closure notification</span>
              </li>
              <li>
                <mat-icon>block</mat-icon>
                <span>No new players can join after closure</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Modal Actions -->
      <div class="modal-actions">
        <button mat-stroked-button 
                class="cancel-button" 
                (click)="onCancel()">
          <mat-icon>close</mat-icon>
          <span>Cancel</span>
        </button>
        <button mat-raised-button 
                class="confirm-button" 
                (click)="onConfirm()">
          <mat-icon>lock</mat-icon>
          <span>Close {{data.eventType}}</span>
        </button>
      </div>
    </div>
  `,
  styleUrl: './close-event-modal.component.scss'
})
export class CloseEventModalComponent {
  constructor(
    public dialogRef: MatDialogRef<CloseEventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CloseEventModalData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}