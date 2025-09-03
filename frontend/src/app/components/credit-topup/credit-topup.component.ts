import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreditService, DepositCreditsRequest } from '../../services/credit.service';

@Component({
  selector: 'app-credit-topup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="page-container">
      <div class="page-content">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <button mat-icon-button (click)="goBack()" class="back-button">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="title-info">
              <h1 class="page-title">
                <mat-icon>add_circle</mat-icon>
                Top Up Credits
              </h1>
              <p class="page-subtitle">Add credits to your account for seamless bookings</p>
            </div>
          </div>
        </div>

        <!-- Credit Top-up Form -->
        <div class="topup-card">
          <div class="card-header">
            <div class="header-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="header-text">
              <h2 class="card-title">Add Credits to Your Account</h2>
              <p class="card-subtitle">Current balance: ₱{{currentBalance | number:'1.2-2'}}</p>
            </div>
          </div>

          <form [formGroup]="topupForm" (ngSubmit)="onSubmit()" class="topup-form">
            <!-- Amount Selection -->
            <div class="amount-section">
              <h3 class="section-title">Select Amount</h3>
              
              <!-- Preset Amounts -->
              <div class="preset-amounts">
                <button 
                  type="button" 
                  mat-stroked-button 
                  *ngFor="let amount of presetAmounts" 
                  [class.selected]="selectedAmount === amount"
                  (click)="selectPresetAmount(amount)"
                  class="preset-button">
                  ₱{{amount}}
                </button>
              </div>

              <!-- Custom Amount -->
              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>Custom Amount</mat-label>
                <input matInput 
                       type="number" 
                       formControlName="amount" 
                       placeholder="Enter amount"
                       min="50"
                       max="10000"
                       step="50">
                <span matPrefix>₱&nbsp;</span>
                <mat-error *ngIf="topupForm.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
                <mat-error *ngIf="topupForm.get('amount')?.hasError('min')">
                  Minimum amount is ₱50
                </mat-error>
                <mat-error *ngIf="topupForm.get('amount')?.hasError('max')">
                  Maximum amount is ₱10,000
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Payment Method -->
            <div class="payment-section">
              <h3 class="section-title">Payment Method</h3>
              
              <mat-form-field appearance="outline" class="payment-field">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="paymentMethod" (selectionChange)="onPaymentMethodChange($event)">
                  <mat-option value="cash">Cash Payment</mat-option>
                  <mat-option value="bank_transfer">Bank Transfer</mat-option>
                  <mat-option value="gcash">GCash</mat-option>
                </mat-select>
                <mat-error *ngIf="topupForm.get('paymentMethod')?.hasError('required')">
                  Payment method is required
                </mat-error>
              </mat-form-field>

              <!-- Payment Reference (for non-cash methods) -->
              <mat-form-field 
                appearance="outline" 
                class="reference-field"
                *ngIf="showPaymentReference">
                <mat-label>{{getPaymentReferenceLabel()}}</mat-label>
                <input matInput 
                       formControlName="paymentReference" 
                       [placeholder]="getPaymentReferencePlaceholder()">
                <mat-error *ngIf="topupForm.get('paymentReference')?.hasError('required')">
                  {{getPaymentReferenceLabel()}} is required
                </mat-error>
              </mat-form-field>

              <!-- Payment Instructions -->
              <div class="payment-instructions" *ngIf="selectedPaymentMethod">
                <div class="instructions-header">
                  <mat-icon>info</mat-icon>
                  <h4>Payment Instructions</h4>
                </div>
                <div class="instructions-content">
                  <ng-container [ngSwitch]="selectedPaymentMethod">
                    <div *ngSwitchCase="'cash'">
                      <p><strong>Cash Payment:</strong></p>
                      <ul>
                        <li>Visit the tennis club office during operating hours</li>
                        <li>Present this credit top-up request to the staff</li>
                        <li>Pay ₱{{topupForm.get('amount')?.value || 0}} in cash</li>
                        <li>Your credits will be activated immediately after payment verification</li>
                      </ul>
                    </div>
                    
                    <div *ngSwitchCase="'bank_transfer'">
                      <p><strong>Bank Transfer:</strong></p>
                      <ul>
                        <li>Transfer ₱{{topupForm.get('amount')?.value || 0}} to our bank account</li>
                        <li><strong>Account Name:</strong> Tennis Club RT2</li>
                        <li><strong>Account Number:</strong> 123-456-789-0</li>
                        <li><strong>Bank:</strong> BPI</li>
                        <li>Enter the transaction reference number above</li>
                        <li>Credits will be processed within 24 hours after verification</li>
                      </ul>
                    </div>
                    
                    <div *ngSwitchCase="'gcash'">
                      <p><strong>GCash Payment:</strong></p>
                      <ul>
                        <li>Send ₱{{topupForm.get('amount')?.value || 0}} to our GCash number</li>
                        <li><strong>GCash Number:</strong> 09123456789</li>
                        <li><strong>Account Name:</strong> Tennis Club RT2</li>
                        <li>Enter the GCash reference number above</li>
                        <li>Credits will be processed within 24 hours after verification</li>
                      </ul>
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>

            <!-- Additional Notes -->
            <div class="notes-section">
              <h3 class="section-title">Additional Notes (Optional)</h3>
              
              <mat-form-field appearance="outline" class="notes-field">
                <mat-label>Notes</mat-label>
                <textarea matInput 
                          formControlName="description" 
                          rows="3"
                          placeholder="Any additional information or special instructions..."></textarea>
              </mat-form-field>
            </div>

            <!-- Summary -->
            <div class="summary-section" *ngIf="topupForm.get('amount')?.value">
              <h3 class="section-title">Summary</h3>
              <div class="summary-content">
                <div class="summary-row">
                  <span>Top-up Amount:</span>
                  <span class="amount">₱{{topupForm.get('amount')?.value | number:'1.2-2'}}</span>
                </div>
                <div class="summary-row">
                  <span>Current Balance:</span>
                  <span>₱{{currentBalance | number:'1.2-2'}}</span>
                </div>
                <div class="summary-row total">
                  <span>New Balance (after processing):</span>
                  <span class="amount">₱{{(currentBalance + (topupForm.get('amount')?.value || 0)) | number:'1.2-2'}}</span>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button 
                type="submit" 
                mat-raised-button 
                color="primary" 
                [disabled]="topupForm.invalid || loading"
                class="submit-button">
                <mat-icon *ngIf="!loading">send</mat-icon>
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                {{loading ? 'Processing...' : 'Submit Credit Request'}}
              </button>
              
              <button 
                type="button" 
                mat-button 
                (click)="goBack()"
                class="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Success Message -->
        <div class="success-message" *ngIf="submitted && !loading">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h3>Credit Request Submitted!</h3>
          <p>Your credit top-up request has been submitted successfully. You will receive credits after payment verification.</p>
          <button mat-raised-button color="primary" (click)="goToDashboard()">
            View Credit Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: 'Roboto', sans-serif;
    }

    .page-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .back-button {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      width: 48px;
      height: 48px;
    }

    .title-info {
      color: white;
    }

    .page-title {
      margin: 0;
      font-size: 2.2rem;
      font-weight: 300;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-title mat-icon {
      font-size: 2.2rem;
      width: 2.2rem;
      height: 2.2rem;
    }

    .page-subtitle {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .topup-card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .header-icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .card-title {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 500;
      color: #333;
    }

    .card-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 1rem;
    }

    .topup-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .section-title {
      font-size: 1.3rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .preset-amounts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .preset-button {
      height: 48px;
      font-size: 1.1rem;
      font-weight: 500;
      border: 2px solid #e0e0e0;
      transition: all 0.3s ease;
    }

    .preset-button:hover {
      border-color: #667eea;
      background-color: rgba(102, 126, 234, 0.05);
    }

    .preset-button.selected {
      border-color: #667eea;
      background-color: #667eea;
      color: white;
    }

    .amount-field,
    .payment-field,
    .reference-field,
    .notes-field {
      width: 100%;
    }

    .payment-instructions {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
      margin-top: 16px;
    }

    .instructions-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .instructions-header h4 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
    }

    .instructions-header mat-icon {
      color: #667eea;
    }

    .instructions-content {
      color: #555;
      line-height: 1.6;
    }

    .instructions-content ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .instructions-content li {
      margin-bottom: 4px;
    }

    .summary-section {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .summary-row.total {
      border-top: 2px solid #e0e0e0;
      padding-top: 16px;
      margin-top: 8px;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .summary-row .amount {
      font-weight: 600;
      color: #667eea;
      font-size: 1.1rem;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .submit-button {
      min-width: 200px;
      height: 48px;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cancel-button {
      min-width: 120px;
      height: 48px;
      font-size: 1.1rem;
    }

    .success-message {
      background: white;
      border-radius: 20px;
      padding: 40px 30px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .success-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #4caf50;
      margin-bottom: 20px;
    }

    .success-message h3 {
      font-size: 1.8rem;
      margin-bottom: 12px;
      color: #333;
    }

    .success-message p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }
      
      .topup-card {
        padding: 20px;
      }
      
      .preset-amounts {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .submit-button,
      .cancel-button {
        width: 100%;
      }
    }
  `]
})
export class CreditTopupComponent implements OnInit {
  topupForm: FormGroup;
  currentBalance = 0;
  loading = false;
  submitted = false;
  selectedAmount = 0;
  selectedPaymentMethod = '';
  showPaymentReference = false;

  presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private creditService: CreditService
  ) {
    this.topupForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(50), Validators.max(10000)]],
      paymentMethod: ['', Validators.required],
      paymentReference: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentBalance();
    this.setupFormValidation();
  }

  loadCurrentBalance(): void {
    this.creditService.getCreditBalance().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentBalance = response.data.balance;
        }
      },
      error: (error) => {
        console.error('Error loading credit balance:', error);
      }
    });
  }

  setupFormValidation(): void {
    // Watch payment method changes
    this.topupForm.get('paymentMethod')?.valueChanges.subscribe(value => {
      this.selectedPaymentMethod = value;
      this.showPaymentReference = value !== 'cash';
      
      // Update payment reference validation
      const paymentReferenceControl = this.topupForm.get('paymentReference');
      if (this.showPaymentReference) {
        paymentReferenceControl?.setValidators([Validators.required]);
      } else {
        paymentReferenceControl?.clearValidators();
      }
      paymentReferenceControl?.updateValueAndValidity();
    });
  }

  selectPresetAmount(amount: number): void {
    this.selectedAmount = amount;
    this.topupForm.patchValue({ amount });
  }

  onPaymentMethodChange(event: any): void {
    this.selectedPaymentMethod = event.value;
  }

  getPaymentReferenceLabel(): string {
    switch (this.selectedPaymentMethod) {
      case 'bank_transfer': return 'Bank Transaction Reference';
      case 'gcash': return 'GCash Reference Number';
      default: return 'Payment Reference';
    }
  }

  getPaymentReferencePlaceholder(): string {
    switch (this.selectedPaymentMethod) {
      case 'bank_transfer': return 'Enter bank transaction reference number';
      case 'gcash': return 'Enter GCash reference number';
      default: return 'Enter payment reference';
    }
  }

  onSubmit(): void {
    if (this.topupForm.invalid || this.loading) return;

    this.loading = true;
    const formData = this.topupForm.value;
    
    const depositRequest: DepositCreditsRequest = {
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      paymentReference: formData.paymentReference || undefined,
      description: formData.description || undefined
    };

    this.creditService.depositCredits(depositRequest).subscribe({
      next: (response) => {
        console.log('Credit deposit request submitted:', response);
        this.loading = false;
        this.submitted = true;
      },
      error: (error) => {
        console.error('Error submitting credit deposit:', error);
        this.loading = false;
        // Handle error - could show error message
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/coins']);
  }

  goToDashboard(): void {
    this.router.navigate(['/credits']);
  }
}