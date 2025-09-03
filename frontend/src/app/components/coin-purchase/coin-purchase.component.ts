import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { CoinService, PurchaseCoinsRequest } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { CoinBalanceComponent } from '../coin-balance/coin-balance.component';

@Component({
  selector: 'app-coin-purchase',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    CoinBalanceComponent
  ],
  template: `
    <div class="purchase-container">
      <div class="header-section">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Purchase Coins</h1>
        <app-coin-balance [compact]="true" [clickable]="false"></app-coin-balance>
      </div>

      <div class="content-section">
        <!-- Current Balance & Info -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>info</mat-icon>
            <mat-card-title>Coin Purchase Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon>monetization_on</mat-icon>
                <div class="info-text">
                  <strong>Exchange Rate:</strong>
                  <span>₱1.00 = 1 Coin</span>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>payment</mat-icon>
                <div class="info-text">
                  <strong>Payment Method:</strong>
                  <span>External payment (Cash, Bank Transfer, GCash)</span>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>schedule</mat-icon>
                <div class="info-text">
                  <strong>Processing:</strong>
                  <span>Coins added after admin verification</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Purchase Form -->
        <mat-card class="purchase-form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>shopping_cart</mat-icon>
            <mat-card-title>Request Coins</mat-card-title>
            <mat-card-subtitle>Submit a request to purchase coins</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="purchaseForm" (ngSubmit)="onSubmit()" class="purchase-form">
              <!-- Amount Input -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Number of Coins</mat-label>
                <input 
                  matInput 
                  type="number" 
                  formControlName="amount"
                  placeholder="Enter amount"
                  min="1"
                  max="10000">
                <mat-icon matSuffix>monetization_on</mat-icon>
                <mat-hint>Minimum: 1 coin, Maximum: 10,000 coins</mat-hint>
                <mat-error *ngIf="purchaseForm.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
                <mat-error *ngIf="purchaseForm.get('amount')?.hasError('min')">
                  Minimum amount is 1 coin
                </mat-error>
                <mat-error *ngIf="purchaseForm.get('amount')?.hasError('max')">
                  Maximum amount is 10,000 coins
                </mat-error>
              </mat-form-field>

              <!-- Cost Display -->
              <div class="cost-display" *ngIf="totalCost > 0">
                <mat-icon>calculate</mat-icon>
                <div class="cost-info">
                  <span class="cost-label">Total Cost:</span>
                  <span class="cost-amount">₱{{totalCost | number:'1.2-2'}}</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <!-- Payment Method -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="paymentMethod">
                  <mat-option value="cash">Cash Payment</mat-option>
                  <mat-option value="bank_transfer">Bank Transfer</mat-option>
                  <mat-option value="gcash">GCash</mat-option>
                </mat-select>
                <mat-hint>Choose your preferred payment method</mat-hint>
                <mat-error *ngIf="purchaseForm.get('paymentMethod')?.hasError('required')">
                  Payment method is required
                </mat-error>
              </mat-form-field>

              <!-- Payment Reference (Optional) -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Reference (Optional)</mat-label>
                <input 
                  matInput 
                  formControlName="paymentReference"
                  placeholder="Transaction ID, Reference number, etc.">
                <mat-icon matSuffix>receipt</mat-icon>
                <mat-hint>Enter reference number if available</mat-hint>
              </mat-form-field>

              <!-- Additional Notes -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Additional Notes (Optional)</mat-label>
                <textarea 
                  matInput 
                  formControlName="notes"
                  placeholder="Any additional information..."
                  rows="3">
                </textarea>
              </mat-form-field>
            </form>
          </mat-card-content>

          <mat-card-actions class="form-actions">
            <button 
              mat-raised-button 
              type="button" 
              (click)="goBack()"
              class="cancel-button">
              Cancel
            </button>
            <button 
              mat-raised-button 
              color="primary" 
              (click)="onSubmit()"
              [disabled]="purchaseForm.invalid || isSubmitting"
              class="submit-button">
              <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
              <mat-icon *ngIf="!isSubmitting">send</mat-icon>
              {{isSubmitting ? 'Submitting...' : 'Submit Request'}}
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Instructions -->
        <mat-card class="instructions-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>help_outline</mat-icon>
            <mat-card-title>How It Works</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="instructions">
              <div class="instruction-step">
                <div class="step-number">1</div>
                <div class="step-text">
                  <strong>Submit Request:</strong> Fill out the form above with your desired coin amount
                </div>
              </div>
              <div class="instruction-step">
                <div class="step-number">2</div>
                <div class="step-text">
                  <strong>Make Payment:</strong> Pay the total amount using your chosen method
                </div>
              </div>
              <div class="instruction-step">
                <div class="step-number">3</div>
                <div class="step-text">
                  <strong>Admin Verification:</strong> Admin will verify your payment and add coins to your account
                </div>
              </div>
              <div class="instruction-step">
                <div class="step-number">4</div>
                <div class="step-text">
                  <strong>Receive Coins:</strong> Your coin balance will be updated once verified
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .purchase-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .header-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      color: white;
    }

    .back-button {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    h1 {
      flex: 1;
      margin: 0;
      font-size: 28px;
      font-weight: 300;
    }

    .content-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-card, .purchase-form-card, .instructions-card {
      animation: slideInUp 0.5s ease-out;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .info-item mat-icon {
      color: #667eea;
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-text strong {
      color: #333;
      font-size: 14px;
    }

    .info-text span {
      color: #666;
      font-size: 13px;
    }

    .purchase-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    .cost-display {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 16px 0;
    }

    .cost-display mat-icon {
      color: #4caf50;
    }

    .cost-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .cost-label {
      font-size: 14px;
      color: #666;
    }

    .cost-amount {
      font-size: 24px;
      font-weight: 600;
      color: #4caf50;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px;
    }

    .cancel-button {
      min-width: 100px;
    }

    .submit-button {
      min-width: 150px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .instructions {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .instruction-step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .step-number {
      width: 32px;
      height: 32px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .step-text {
      flex: 1;
      padding-top: 4px;
    }

    .step-text strong {
      display: block;
      margin-bottom: 4px;
      color: #333;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 600px) {
      .purchase-container {
        padding: 16px;
      }
      
      .header-section h1 {
        font-size: 24px;
      }
      
      .info-grid {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .cancel-button, .submit-button {
        width: 100%;
      }
    }
  `]
})
export class CoinPurchaseComponent implements OnInit {
  purchaseForm: FormGroup;
  isSubmitting = false;
  totalCost = 0;

  constructor(
    private fb: FormBuilder,
    private coinService: CoinService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.purchaseForm = this.fb.group({
      amount: [100, [Validators.required, Validators.min(1), Validators.max(10000)]],
      paymentMethod: ['gcash', Validators.required],
      paymentReference: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Watch for amount changes to update cost
    this.purchaseForm.get('amount')?.valueChanges.subscribe(amount => {
      this.totalCost = amount && amount > 0 ? amount : 0;
    });

    // Set initial cost
    this.totalCost = this.purchaseForm.get('amount')?.value || 0;
  }

  onSubmit(): void {
    if (this.purchaseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const request: PurchaseCoinsRequest = {
        amount: this.purchaseForm.get('amount')?.value,
        paymentMethod: this.purchaseForm.get('paymentMethod')?.value,
        paymentReference: this.purchaseForm.get('paymentReference')?.value || undefined
      };

      this.coinService.purchaseCoins(request).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open(
              `Coin purchase request submitted! ${request.amount} coins requested for ₱${this.totalCost}`,
              'OK',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
            this.router.navigate(['/coins/history']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Purchase request failed:', error);
          
          const errorMessage = error.error?.error || 'Failed to submit purchase request';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/coins']);
  }
}