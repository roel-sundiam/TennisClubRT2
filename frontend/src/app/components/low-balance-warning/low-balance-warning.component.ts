import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CoinService } from '../../services/coin.service';
import { PageVisitTrackerService } from '../../services/page-visit-tracker.service';

@Component({
  selector: 'app-low-balance-warning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <div class="low-balance-dialog" *ngIf="showDialog">
      <div class="dialog-content">
        <div class="warning-header">
          <mat-icon class="warning-icon">warning</mat-icon>
          <h2>Low Coin Balance!</h2>
        </div>
        
        <div class="warning-message">
          <p>Your coin balance is running low.</p>
          <div class="balance-info">
            <span class="current-balance">Current Balance: {{currentBalance}} coins</span>
            <span class="warning-threshold">Warning Threshold: {{warningThreshold}} coins</span>
          </div>
        </div>

        <div class="warning-actions">
          <button mat-raised-button color="primary" (click)="purchaseCoins()">
            <mat-icon>add_shopping_cart</mat-icon>
            Purchase Coins
          </button>
          <button mat-button (click)="dismissWarning()">
            Dismiss
          </button>
        </div>

        <div class="dont-show-again">
          <label>
            <input type="checkbox" [(ngModel)]="dontShowAgain">
            Don't show this warning again today
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .low-balance-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    }

    .dialog-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease-out;
    }

    .warning-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      text-align: center;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .warning-header h2 {
      margin: 0;
      color: #333;
      font-weight: 500;
    }

    .warning-message {
      margin-bottom: 24px;
      text-align: center;
    }

    .warning-message p {
      margin-bottom: 12px;
      color: #666;
    }

    .balance-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .current-balance {
      font-weight: 600;
      color: #ff6b6b;
    }

    .warning-threshold {
      font-size: 14px;
      color: #666;
    }

    .warning-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 16px;
    }

    .dont-show-again {
      text-align: center;
      font-size: 14px;
    }

    .dont-show-again label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #666;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LowBalanceWarningComponent implements OnInit, OnDestroy {
  showDialog = false;
  currentBalance = 0;
  warningThreshold = 10;
  dontShowAgain = false;

  private subscriptions = new Subscription();
  private warningShownToday = false;

  constructor(
    private authService: AuthService,
    private coinService: CoinService,
    private pageVisitTracker: PageVisitTrackerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeWarningSystem();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeWarningSystem(): void {
    // Check if warnings are disabled for today
    const disabledUntil = localStorage.getItem('lowBalanceWarningDisabled');
    if (disabledUntil) {
      const disabledDate = new Date(disabledUntil);
      const today = new Date();
      if (disabledDate.toDateString() === today.toDateString()) {
        this.warningShownToday = true;
      } else {
        localStorage.removeItem('lowBalanceWarningDisabled');
      }
    }

    // Subscribe to coin balance changes
    this.subscriptions.add(
      this.coinService.coinBalance$.subscribe(balance => {
        this.currentBalance = balance;
        this.checkForLowBalance();
      })
    );

    // Subscribe to page visit events for contextual warnings
    this.subscriptions.add(
      this.pageVisitTracker.pageVisit$.subscribe(visitEvent => {
        if (visitEvent && !visitEvent.success) {
          // Show immediate warning for insufficient coins
          this.showInsufficientCoinsWarning(visitEvent.message);
        } else if (visitEvent && visitEvent.success) {
          // Check if balance is now low after spending coins
          this.currentBalance = visitEvent.data.remainingBalance;
          this.checkForLowBalance();
        }
      })
    );

    // Initial balance check
    this.currentBalance = this.authService.getCoinBalance();
    this.checkForLowBalance();
  }

  private checkForLowBalance(): void {
    if (this.currentBalance <= this.warningThreshold && !this.warningShownToday && this.authService.isAuthenticated()) {
      this.showWarning();
    }
  }

  private showWarning(): void {
    if (this.showDialog) return; // Prevent multiple dialogs

    this.showDialog = true;
    this.warningShownToday = true;
  }

  private showInsufficientCoinsWarning(message: string): void {
    const snackBarRef = this.snackBar.open(
      message,
      'Purchase Coins',
      {
        duration: 8000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.purchaseCoins();
    });
  }

  purchaseCoins(): void {
    this.dismissWarning();
    this.router.navigate(['/coins/purchase']);
  }

  dismissWarning(): void {
    if (this.dontShowAgain) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem('lowBalanceWarningDisabled', tomorrow.toISOString());
    }
    
    this.showDialog = false;
    this.dontShowAgain = false;
  }
}

// Service for managing low balance warnings globally
export class LowBalanceWarningService {
  private warningThreshold = 10;
  private criticalThreshold = 2;
  private lastWarningTime = 0;
  private warningCooldown = 300000; // 5 minutes

  constructor(
    private authService: AuthService,
    private coinService: CoinService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  checkBalance(currentBalance: number): void {
    const now = Date.now();
    
    // Avoid showing warnings too frequently
    if (now - this.lastWarningTime < this.warningCooldown) {
      return;
    }

    if (currentBalance <= this.criticalThreshold) {
      this.showCriticalWarning(currentBalance);
    } else if (currentBalance <= this.warningThreshold) {
      this.showLowBalanceWarning(currentBalance);
    }

    this.lastWarningTime = now;
  }

  private showCriticalWarning(balance: number): void {
    const snackBarRef = this.snackBar.open(
      `Critical: Only ${balance} coins remaining! Some features may be unavailable.`,
      'Purchase Now',
      {
        duration: 0, // Don't auto-dismiss
        panelClass: ['critical-warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/coins/purchase']);
    });
  }

  private showLowBalanceWarning(balance: number): void {
    const snackBarRef = this.snackBar.open(
      `Low balance: ${balance} coins remaining`,
      'Purchase Coins',
      {
        duration: 6000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/coins/purchase']);
    });
  }

  updateWarningThreshold(threshold: number): void {
    this.warningThreshold = threshold;
  }

  updateCriticalThreshold(threshold: number): void {
    this.criticalThreshold = threshold;
  }
}