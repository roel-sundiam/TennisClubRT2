import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

export interface InsufficientCoinsData {
  requiredCoins: number;
  currentBalance: number;
  featureName: string;
  targetRoute: string;
}

@Component({
  selector: 'app-insufficient-coins-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="insufficient-coins-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="icon-container">
          <mat-icon class="warning-icon">account_balance_wallet</mat-icon>
        </div>
        <h2 mat-dialog-title>Insufficient Coins</h2>
        <button 
          mat-icon-button 
          class="close-btn" 
          (click)="closeModal()"
          aria-label="Close modal">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <mat-dialog-content class="modal-content">
        <div class="coins-info">
          <div class="balance-display">
            <div class="balance-item current-balance">
              <mat-icon>monetization_on</mat-icon>
              <div class="balance-text">
                <span class="label">Current Balance</span>
                <span class="amount">{{data.currentBalance}} coins</span>
              </div>
            </div>
            
            <div class="balance-divider">
              <mat-icon>arrow_forward</mat-icon>
            </div>
            
            <div class="balance-item required-coins">
              <mat-icon>star</mat-icon>
              <div class="balance-text">
                <span class="label">Required</span>
                <span class="amount">{{data.requiredCoins}} coins</span>
              </div>
            </div>
          </div>

          <div class="feature-info">
            <p class="message">
              You need <strong>{{data.requiredCoins}} coin{{data.requiredCoins !== 1 ? 's' : ''}}</strong> 
              to access <strong>{{data.featureName}}</strong>.
            </p>
            
            <div class="shortage-info" *ngIf="coinsNeeded > 0">
              <mat-icon>info</mat-icon>
              <span>You need {{coinsNeeded}} more coin{{coinsNeeded !== 1 ? 's' : ''}}.</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions class="modal-actions">
        <button 
          mat-button 
          class="cancel-btn"
          (click)="closeModal()">
          <mat-icon>arrow_back</mat-icon>
          Go Back
        </button>
        
        <button 
          mat-raised-button 
          color="primary"
          class="purchase-btn"
          (click)="purchaseCoins()">
          <mat-icon>shopping_cart</mat-icon>
          Buy Coins
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .insufficient-coins-modal {
      min-width: 400px;
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid #e0e0e0;
      position: relative;
    }

    .icon-container {
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }

    .warning-icon {
      color: white;
      font-size: 30px;
      width: 30px;
      height: 30px;
    }

    h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 500;
      flex: 1;
    }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: #666;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }
    }

    .modal-content {
      padding: 1.5rem !important;
    }

    .coins-info {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .balance-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .balance-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      
      &.current-balance mat-icon {
        color: #ff6b6b;
      }
      
      &.required-coins mat-icon {
        color: #ffd700;
      }
    }

    .balance-text {
      display: flex;
      flex-direction: column;
      
      .label {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      
      .amount {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }
    }

    .balance-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 1rem;
      
      mat-icon {
        color: #999;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .feature-info {
      text-align: center;
      
      .message {
        font-size: 1.1rem;
        line-height: 1.5;
        color: #555;
        margin: 0 0 1rem 0;
        
        strong {
          color: #1976d2;
        }
      }
    }

    .shortage-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border: 1px solid #ffd93d;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      color: #856404;
      
      mat-icon {
        color: #f39c12;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .modal-actions {
      padding: 1rem 1.5rem 1.5rem !important;
      border-top: 1px solid #e0e0e0;
      margin: 0 !important;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .cancel-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }
    }

    .purchase-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 120px;
      font-weight: 500;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Animation */
    .insufficient-coins-modal {
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .insufficient-coins-modal {
        min-width: 320px;
      }
      
      .modal-header {
        padding: 1rem;
      }
      
      .icon-container {
        width: 50px;
        height: 50px;
        margin-right: 0.75rem;
        
        .warning-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      
      h2 {
        font-size: 1.3rem;
      }
      
      .balance-display {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .balance-divider {
        transform: rotate(90deg);
        margin: 0;
      }
      
      .modal-actions {
        flex-direction: column-reverse;
        
        .cancel-btn, .purchase-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class InsufficientCoinsModalComponent {
  coinsNeeded: number;

  constructor(
    private dialogRef: MatDialogRef<InsufficientCoinsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InsufficientCoinsData,
    private router: Router
  ) {
    this.coinsNeeded = Math.max(0, data.requiredCoins - data.currentBalance);
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  purchaseCoins(): void {
    this.dialogRef.close();
    this.router.navigate(['/coins/purchase'], {
      queryParams: {
        reason: 'insufficient_coins',
        requiredCoins: this.data.requiredCoins,
        targetRoute: this.data.targetRoute,
        shortage: this.coinsNeeded
      }
    });
  }
}