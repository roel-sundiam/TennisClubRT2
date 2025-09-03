import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info';
  icon?: string;
  details?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog">
      <div class="dialog-header" [class]="data.type || 'warning'">
        <mat-icon class="dialog-icon">{{ data.icon || getDefaultIcon() }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <div mat-dialog-content class="dialog-content">
        <p class="dialog-message">{{ data.message }}</p>
        <div *ngIf="data.details" class="dialog-details">
          <p>{{ data.details }}</p>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button 
                (click)="onCancel()" 
                class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button 
                [color]="getButtonColor()" 
                (click)="onConfirm()" 
                class="confirm-button">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      width: 100%;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 0;
      margin-bottom: 16px;
    }

    .dialog-header.warning {
      color: #f57c00;
    }

    .dialog-header.error {
      color: #d32f2f;
    }

    .dialog-header.info {
      color: #1976d2;
    }

    .dialog-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    h2[mat-dialog-title] {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-content {
      padding: 0 24px 20px;
    }

    .dialog-message {
      font-size: 16px;
      line-height: 1.5;
      margin: 0 0 12px;
      color: rgba(0, 0, 0, 0.87);
    }

    .dialog-details {
      background: rgba(0, 0, 0, 0.04);
      border-radius: 8px;
      padding: 12px;
      border-left: 4px solid #2196f3;
    }

    .dialog-details p {
      margin: 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    .dialog-actions {
      padding: 8px 24px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .cancel-button {
      min-width: 80px;
    }

    .confirm-button {
      min-width: 100px;
    }

    /* Glassmorphism effect */
    :host ::ng-deep .mat-mdc-dialog-surface {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Animation */
    :host ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-elevation: none;
    }

    @media (max-width: 768px) {
      .confirmation-dialog {
        max-width: 90vw;
      }
      
      .dialog-header {
        padding: 16px 16px 0;
      }
      
      .dialog-content {
        padding: 0 16px 16px;
      }
      
      .dialog-actions {
        padding: 8px 16px 16px;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getDefaultIcon(): string {
    switch (this.data.type) {
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'warning':
      default:
        return 'warning';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'error':
        return 'warn';
      case 'info':
        return 'primary';
      case 'warning':
      default:
        return 'warn';
    }
  }
}