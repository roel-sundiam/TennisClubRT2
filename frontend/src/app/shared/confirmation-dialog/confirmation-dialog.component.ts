import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
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
      <div class="dialog-header" [ngClass]="'dialog-' + (data.type || 'info')">
        <mat-icon class="dialog-icon">{{ data.icon || getDefaultIcon() }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>
        
        <button 
          mat-raised-button 
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
      max-width: 500px;
      min-width: 350px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 16px 24px;
      margin: -24px -24px 0 -24px;
      border-radius: 4px 4px 0 0;
    }

    .dialog-header.dialog-warning {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .dialog-header.dialog-danger {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .dialog-header.dialog-info {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .dialog-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-content {
      padding: 20px 0;
      font-size: 16px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.87);
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      margin-top: 8px;
    }

    .cancel-button {
      color: rgba(0, 0, 0, 0.54);
    }

    .confirm-button {
      min-width: 100px;
    }

    @media (max-width: 480px) {
      .confirmation-dialog {
        min-width: 280px;
        max-width: 95vw;
      }

      .dialog-actions {
        flex-direction: column-reverse;
        gap: 8px;
      }

      .cancel-button,
      .confirm-button {
        width: 100%;
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
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'warning':
        return 'accent';
      case 'info':
      default:
        return 'primary';
    }
  }
}