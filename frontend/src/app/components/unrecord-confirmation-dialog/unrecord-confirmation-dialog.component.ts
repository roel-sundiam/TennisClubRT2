import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface UnrecordDialogData {
  paymentId: string;
  memberName: string;
  amount: number;
  referenceNumber: string;
  description?: string;
}

@Component({
  selector: 'app-unrecord-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="unrecord-dialog">
      <!-- Header -->
      <div mat-dialog-title class="dialog-header">
        <div class="header-icon">
          <mat-icon class="warning-icon">warning</mat-icon>
        </div>
        <div class="header-content">
          <h2>Unrecord Payment</h2>
          <p class="subtitle">This action will reverse the payment recording</p>
        </div>
      </div>

      <!-- Content -->
      <div mat-dialog-content class="dialog-content">
        <!-- Payment Details Card -->
        <div class="payment-details">
          <h3>Payment Details</h3>
          <div class="detail-row">
            <span class="label">Member:</span>
            <span class="value">{{data.memberName}}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount:</span>
            <span class="value amount">₱{{data.amount.toFixed(2)}}</span>
          </div>
          <div class="detail-row">
            <span class="label">Reference:</span>
            <span class="value">{{data.referenceNumber}}</span>
          </div>
          <div class="detail-row" *ngIf="data.description">
            <span class="label">Description:</span>
            <span class="value">{{data.description}}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Consequences -->
        <div class="consequences">
          <h3>What will happen:</h3>
          <div class="consequence-list">
            <div class="consequence-item">
              <mat-icon class="consequence-icon">arrow_forward</mat-icon>
              <span>Status changes from <strong>"Recorded"</strong> to <strong>"Completed"</strong></span>
            </div>
            <div class="consequence-item">
              <mat-icon class="consequence-icon">remove_circle</mat-icon>
              <span>Payment will be <strong>removed</strong> from Court Usage Report</span>
            </div>
            <div class="consequence-item">
              <mat-icon class="consequence-icon">check_circle</mat-icon>
              <span>Payment remains as <strong>paid</strong> but not counted in monthly reports</span>
            </div>
            <div class="consequence-item">
              <mat-icon class="consequence-icon">history</mat-icon>
              <span>Action will be <strong>logged</strong> in payment notes for audit trail</span>
            </div>
          </div>
        </div>

        <!-- Warning -->
        <div class="warning-box">
          <mat-icon class="warning-icon">info</mat-icon>
          <span>This action cannot be undone. The payment can be re-recorded later if needed.</span>
        </div>
      </div>

      <!-- Actions -->
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-btn">
          <mat-icon>undo</mat-icon>
          Unrecord Payment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .unrecord-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 0 16px 0;
      margin: 0;
    }

    .header-icon .warning-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ff9800;
    }

    .header-content h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .dialog-content {
      padding: 0 0 16px 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .payment-details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .payment-details h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      color: #333;
      text-align: right;
    }

    .value.amount {
      color: #2e7d32;
      font-size: 16px;
    }

    .consequences {
      margin: 16px 0;
    }

    .consequences h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .consequence-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .consequence-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .consequence-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #2196f3;
    }

    .warning-box {
      background: #fff3e0;
      border: 1px solid #ffcc02;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }

    .warning-box .warning-icon {
      color: #ff9800;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .warning-box span {
      font-size: 14px;
      color: #e65100;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0 0 0;
      margin: 0;
    }

    .cancel-btn {
      color: #666;
    }

    .cancel-btn:hover {
      background-color: #f5f5f5;
    }

    .confirm-btn {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      font-weight: 600;
    }

    .confirm-btn:hover {
      background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
    }

    .confirm-btn mat-icon,
    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    mat-divider {
      margin: 16px 0;
    }
  `]
})
export class UnrecordConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UnrecordConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnrecordDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}