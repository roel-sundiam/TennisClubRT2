import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

export interface EditPaymentAmountData {
  paymentId: string;
  memberName: string;
  currentAmount: number;
  reservationDate: string;
  timeSlot: string;
}

@Component({
  selector: 'app-edit-payment-amount-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="payment-edit-modal">
      <div class="modal-header">
        <div class="header-content">
          <mat-icon class="header-icon">edit</mat-icon>
          <div class="header-text">
            <h2>Edit Payment Amount</h2>
            <p class="member-info">{{data.memberName}} • {{data.reservationDate}} • {{data.timeSlot}}</p>
          </div>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-body">
        <div class="amount-section">
          <div class="current-amount">
            <span class="label">Current Amount:</span>
            <span class="amount">₱{{data.currentAmount.toFixed(2)}}</span>
          </div>

          <mat-form-field appearance="outline" class="new-amount-field">
            <mat-label>New Amount</mat-label>
            <input matInput 
                   type="number" 
                   [(ngModel)]="newAmount" 
                   min="0" 
                   step="0.01"
                   placeholder="Enter new amount"
                   (keydown.enter)="onSave()"
                   #amountInput>
            <span matPrefix>₱</span>
            <mat-error *ngIf="newAmount <= 0">Amount must be greater than 0</mat-error>
          </mat-form-field>

          <div class="amount-difference" *ngIf="newAmount > 0 && newAmount !== data.currentAmount">
            <div class="difference-label">Difference:</div>
            <div class="difference-amount" [class.positive]="newAmount > data.currentAmount" [class.negative]="newAmount < data.currentAmount">
              <mat-icon>{{newAmount > data.currentAmount ? 'trending_up' : 'trending_down'}}</mat-icon>
              ₱{{Math.abs(newAmount - data.currentAmount).toFixed(2)}}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button mat-button (click)="onCancel()" class="cancel-button">
          Cancel
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSave()" 
                [disabled]="!isValidAmount()"
                class="save-button">
          <mat-icon>save</mat-icon>
          Update Amount
        </button>
      </div>
    </div>
  `,
  styles: [`
    .payment-edit-modal {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 16px 24px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex: 1;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 4px;
    }

    .header-text h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .member-info {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
      font-weight: 400;
    }

    .close-button {
      color: white;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }

    .close-button:hover {
      opacity: 1;
    }

    .modal-body {
      padding: 32px 24px;
    }

    .amount-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .current-amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border-left: 4px solid #e2e8f0;
    }

    .current-amount .label {
      font-weight: 500;
      color: #64748b;
    }

    .current-amount .amount {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .new-amount-field {
      width: 100%;
    }

    .new-amount-field ::ng-deep .mat-mdc-form-field-flex {
      background: #f8fafc;
      border-radius: 12px;
    }

    .new-amount-field ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-flex {
      background: #ffffff;
    }

    .new-amount-field ::ng-deep input {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .amount-difference {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
    }

    .difference-amount {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .difference-amount.positive {
      color: #059669;
    }

    .difference-amount.negative {
      color: #dc2626;
    }

    .difference-amount.positive {
      background: #ecfdf5;
    }

    .difference-amount.negative {
      background: #fef2f2;
    }

    .amount-difference.positive {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    .amount-difference.negative {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .cancel-button {
      color: #64748b;
    }

    .save-button {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .save-button:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    .save-button:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
    }

    .save-button .mat-icon {
      margin-right: 8px;
    }

    /* Mobile responsiveness */
    @media (max-width: 600px) {
      .payment-edit-modal {
        max-width: 100%;
        border-radius: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        padding: 16px;
      }

      .header-text h2 {
        font-size: 20px;
      }

      .modal-body {
        flex: 1;
        padding: 24px 16px;
      }

      .modal-actions {
        padding: 16px;
      }
    }
  `]
})
export class EditPaymentAmountDialogComponent {
  newAmount: number;
  Math = Math; // Expose Math to template

  constructor(
    public dialogRef: MatDialogRef<EditPaymentAmountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPaymentAmountData
  ) {
    this.newAmount = data.currentAmount;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isValidAmount()) {
      this.dialogRef.close(this.newAmount);
    }
  }

  isValidAmount(): boolean {
    return this.newAmount > 0 && this.newAmount !== this.data.currentAmount;
  }
}