import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

export interface CancellationDialogData {
  paymentId: string;
  paymentAmount: string;
  reservationDate: string;
  reservationTime: string;
  isReservationCancellation?: boolean;
}

export interface CancellationResult {
  cancelled: boolean;
  reason: string;
}

@Component({
  selector: 'app-cancellation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
  ],
  template: `
    <div class="cancellation-dialog">
      <!-- Header -->
      <div mat-dialog-title class="dialog-header">
        <div class="header-icon">
          <mat-icon>cancel</mat-icon>
        </div>
        <div class="header-text">
          <h2>{{data.isReservationCancellation ? 'Cancel Reservation' : 'Cancel Payment'}}</h2>
          <p class="payment-details">
            {{data.paymentAmount}} for {{data.reservationDate}} at {{data.reservationTime}}
          </p>
        </div>
      </div>

      <!-- Content -->
      <div mat-dialog-content class="dialog-content">
        <form [formGroup]="cancellationForm" class="cancellation-form">
          
          <div class="question-section">
            <h3>Why are you cancelling this payment?</h3>
            <p class="help-text">Please select the reason for cancellation to help us improve our service.</p>
          </div>

          <mat-divider></mat-divider>

          <!-- Reason Selection -->
          <div class="reason-selection">
            <mat-radio-group formControlName="selectedReason" class="reason-radio-group">
              <mat-radio-button 
                *ngFor="let reason of cancellationReasons" 
                [value]="reason"
                class="reason-option">
                <div class="reason-content">
                  <div class="reason-icon">
                    <mat-icon>{{getReasonIcon(reason)}}</mat-icon>
                  </div>
                  <div class="reason-text">
                    <span class="reason-title">{{reason}}</span>
                    <span class="reason-description">{{getReasonDescription(reason)}}</span>
                  </div>
                </div>
              </mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Custom Reason Input -->
          <div class="custom-reason-section" *ngIf="cancellationForm.get('selectedReason')?.value === 'Other reason'">
            <mat-divider></mat-divider>
            <mat-form-field appearance="outline" class="custom-reason-field">
              <mat-label>Please specify the reason</mat-label>
              <input 
                matInput 
                formControlName="customReason"
                placeholder="Enter specific reason for cancellation..."
                maxlength="200">
              <mat-hint>Help us understand what happened</mat-hint>
              <mat-error *ngIf="cancellationForm.get('customReason')?.hasError('required')">
                Please provide a specific reason
              </mat-error>
            </mat-form-field>
          </div>
        </form>
      </div>

      <!-- Actions -->
      <div mat-dialog-actions class="dialog-actions">
        <button 
          mat-stroked-button
          (click)="onCancel()"
          class="cancel-action-btn">
          <mat-icon>close</mat-icon>
          Keep Payment
        </button>
        
        <button 
          mat-raised-button
          color="warn"
          (click)="onConfirmCancellation()"
          [disabled]="!isFormValid()"
          class="confirm-cancel-btn">
          <mat-icon>delete</mat-icon>
          Cancel Payment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cancellation-dialog {
      min-width: 500px;
      max-width: 600px;
      font-family: 'Roboto', sans-serif;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 16px 24px !important;
      margin: 0 !important;
      border-bottom: 1px solid #e0e0e0;
      
      .header-icon {
        background: rgba(244, 67, 54, 0.1);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        mat-icon {
          color: #f44336;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      
      .header-text {
        flex: 1;
        
        h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 500;
          color: #212121;
        }
        
        .payment-details {
          margin: 0;
          font-size: 14px;
          color: #666;
          font-weight: 400;
        }
      }
    }

    .dialog-content {
      padding: 20px 24px !important;
      
      .question-section {
        margin-bottom: 20px;
        
        h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 500;
          color: #212121;
        }
        
        .help-text {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }
      }
    }

    .reason-selection {
      margin: 20px 0;
      
      .reason-radio-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .reason-option {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 0;
        margin: 0;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #2196f3;
          background: rgba(33, 150, 243, 0.04);
        }
        
        &.mat-mdc-radio-checked {
          border-color: #2196f3;
          background: rgba(33, 150, 243, 0.08);
        }
        
        ::ng-deep .mdc-radio {
          margin: 16px;
        }
        
        .reason-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 16px 16px 0;
          width: 100%;
          
          .reason-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            
            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
              color: #666;
            }
          }
          
          .reason-text {
            flex: 1;
            
            .reason-title {
              display: block;
              font-size: 14px;
              font-weight: 500;
              color: #212121;
              margin-bottom: 2px;
            }
            
            .reason-description {
              display: block;
              font-size: 12px;
              color: #666;
              line-height: 1.3;
            }
          }
        }
      }
    }

    .custom-reason-section {
      margin-top: 20px;
      
      mat-divider {
        margin-bottom: 20px;
      }
      
      .custom-reason-field {
        width: 100%;
      }
    }

    .dialog-actions {
      padding: 16px 24px 24px 24px !important;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin: 0 !important;
      
      .cancel-action-btn {
        color: #666;
        border-color: #e0e0e0;
        
        &:hover {
          background: rgba(0, 0, 0, 0.04);
          border-color: #666;
        }
      }
      
      .confirm-cancel-btn {
        min-width: 140px;
        
        &:disabled {
          opacity: 0.6;
        }
      }
    }

    @media (max-width: 600px) {
      .cancellation-dialog {
        min-width: auto;
        width: 100%;
        max-width: 100%;
      }
      
      .dialog-header {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
      
      .reason-content {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }
    }
  `]
})
export class CancellationDialogComponent {
  cancellationForm: FormGroup;
  
  cancellationReasons = [
    'Weather conditions (rain, storm, etc.)',
    'Player(s) did not show up',
    'Court maintenance/unavailable',
    'Personal emergency',
    'Duplicate payment',
    'Other reason'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CancellationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancellationDialogData
  ) {
    this.cancellationForm = this.fb.group({
      selectedReason: ['', Validators.required],
      customReason: ['']
    });

    // Add conditional validator for custom reason
    this.cancellationForm.get('selectedReason')?.valueChanges.subscribe(value => {
      const customReasonControl = this.cancellationForm.get('customReason');
      if (value === 'Other reason') {
        customReasonControl?.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        customReasonControl?.clearValidators();
      }
      customReasonControl?.updateValueAndValidity();
    });
  }

  getReasonIcon(reason: string): string {
    const iconMap: { [key: string]: string } = {
      'Weather conditions (rain, storm, etc.)': 'cloud_queue',
      'Player(s) did not show up': 'person_off',
      'Court maintenance/unavailable': 'build',
      'Personal emergency': 'local_hospital',
      'Duplicate payment': 'content_copy',
      'Other reason': 'help'
    };
    return iconMap[reason] || 'info';
  }

  getReasonDescription(reason: string): string {
    const descriptionMap: { [key: string]: string } = {
      'Weather conditions (rain, storm, etc.)': 'Rain, storm, or unsafe playing conditions',
      'Player(s) did not show up': 'Some players cancelled or were no-shows',
      'Court maintenance/unavailable': 'Court was closed or under maintenance',
      'Personal emergency': 'Unexpected personal situation arose',
      'Duplicate payment': 'This payment was made by mistake',
      'Other reason': 'Please specify your reason below'
    };
    return descriptionMap[reason] || '';
  }

  isFormValid(): boolean {
    const selectedReason = this.cancellationForm.get('selectedReason')?.value;
    if (!selectedReason) return false;

    if (selectedReason === 'Other reason') {
      const customReason = this.cancellationForm.get('customReason')?.value;
      return customReason && customReason.trim().length >= 3;
    }

    return true;
  }

  onCancel(): void {
    this.dialogRef.close({ cancelled: false, reason: '' });
  }

  onConfirmCancellation(): void {
    if (!this.isFormValid()) return;

    const selectedReason = this.cancellationForm.get('selectedReason')?.value;
    let finalReason = selectedReason;

    if (selectedReason === 'Other reason') {
      finalReason = this.cancellationForm.get('customReason')?.value.trim();
    }

    this.dialogRef.close({ 
      cancelled: true, 
      reason: finalReason 
    });
  }
}