import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AppUpdateService } from '../../services/app-update.service';

@Component({
  selector: 'app-update-banner',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="update-banner" *ngIf="showBanner">
      <mat-card class="update-card">
        <div class="update-content">
          <mat-icon class="update-icon">system_update</mat-icon>
          <div class="update-text">
            <h3>App Update Available</h3>
            <p>A new version of Tennis Club RT2 is ready to install</p>
          </div>
          <div class="update-actions">
            <button mat-button (click)="dismissBanner()" class="dismiss-btn">
              Later
            </button>
            <button mat-raised-button color="primary" (click)="updateNow()" class="update-btn">
              Update Now
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .update-banner {
      position: fixed;
      top: 70px; /* Below the toolbar */
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      width: 90%;
      max-width: 500px;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        transform: translate(-50%, -100%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }

    .update-card {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
    }

    .update-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    .update-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #fff;
    }

    .update-text {
      flex: 1;
    }

    .update-text h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .update-text p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .update-actions {
      display: flex;
      gap: 8px;
    }

    .dismiss-btn {
      color: rgba(255, 255, 255, 0.7);
    }

    .update-btn {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
    }

    .update-btn:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 600px) {
      .update-banner {
        width: 95%;
        top: 60px;
      }
      
      .update-content {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
      
      .update-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class UpdateBannerComponent {
  showBanner = false;
  private dismissTimeout?: number;

  constructor(private updateService: AppUpdateService) {}

  ngOnInit(): void {
    // Check update status periodically
    setInterval(() => {
      const status = this.updateService.getUpdateStatus();
      this.showBanner = status.available && status.enabled;
    }, 1000);

    // Auto-dismiss after 45 seconds
    if (this.showBanner) {
      this.dismissTimeout = window.setTimeout(() => {
        this.dismissBanner();
      }, 45000);
    }
  }

  ngOnDestroy(): void {
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
    }
  }

  updateNow(): void {
    this.showBanner = false;
    this.updateService.forceUpdateCheck();
  }

  dismissBanner(): void {
    this.showBanner = false;
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
    }
  }
}