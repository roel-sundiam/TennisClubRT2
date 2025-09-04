import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { interval, fromEvent } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  private updateAvailable = false;
  private promptShown = false;

  constructor(
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.checkForServiceWorker();
  }

  /**
   * Initialize the app update service
   */
  init(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('🔄 Service Worker not enabled - updates disabled');
      return;
    }

    this.checkForUpdates();
    this.handleUpdateAvailable();
    this.handleUpdateActivated();
    this.checkPeriodically();
    this.checkOnFocus();
  }

  /**
   * Check if service worker is available
   */
  private checkForServiceWorker(): void {
    if (!('serviceWorker' in navigator)) {
      console.log('🔄 Service Worker not supported in this browser');
      return;
    }
    
    if (!this.swUpdate.isEnabled) {
      console.log('🔄 Service Worker updates are disabled');
      return;
    }

    console.log('✅ Service Worker update service initialized');
  }

  /**
   * Check for available updates
   */
  private checkForUpdates(): void {
    this.swUpdate.checkForUpdate().then(updateFound => {
      if (updateFound) {
        console.log('🔄 Update check completed - update found');
      } else {
        console.log('✅ Update check completed - app is up to date');
      }
    }).catch(error => {
      console.error('❌ Error checking for updates:', error);
    });
  }

  /**
   * Handle when an update becomes available
   */
  private handleUpdateAvailable(): void {
    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_DETECTED') {
        console.log('🔄 New version detected, downloading...');
      } else if (event.type === 'VERSION_READY') {
        this.updateAvailable = true;
        console.log('✅ New version ready for activation');
        this.showUpdatePrompt();
      } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
        console.error('❌ Version installation failed:', event.error);
        this.showErrorNotification('Update installation failed. Please refresh manually.');
      }
    });
  }

  /**
   * Handle when an update is activated
   */
  private handleUpdateActivated(): void {
    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        console.log('🎉 New version activated successfully');
        this.showSuccessNotification('App updated successfully!');
        
        // Reset flags
        this.updateAvailable = false;
        this.promptShown = false;
      }
    });
  }

  /**
   * Check for updates periodically (every 30 minutes)
   */
  private checkPeriodically(): void {
    if (!this.swUpdate.isEnabled) return;

    interval(30 * 60 * 1000).subscribe(() => {
      console.log('🔄 Periodic update check...');
      this.checkForUpdates();
    });
  }

  /**
   * Check for updates when app regains focus
   */
  private checkOnFocus(): void {
    if (!this.swUpdate.isEnabled) return;

    fromEvent(window, 'focus').subscribe(() => {
      console.log('🔄 App focused - checking for updates...');
      setTimeout(() => this.checkForUpdates(), 1000);
    });
  }

  /**
   * Show update prompt to user
   */
  private showUpdatePrompt(): void {
    if (this.promptShown) return;
    this.promptShown = true;

    const snackBarRef = this.snackBar.open(
      '🔄 App update available!', 
      'UPDATE NOW', 
      {
        duration: 0, // Persistent until action
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['update-snackbar']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.applyUpdate();
    });

    // Auto-dismiss after 30 seconds and apply update
    setTimeout(() => {
      if (this.updateAvailable && snackBarRef) {
        snackBarRef.dismiss();
        this.applyUpdateSilently();
      }
    }, 30000);
  }

  /**
   * Apply the pending update immediately
   */
  private applyUpdate(): void {
    if (!this.updateAvailable) return;

    console.log('🔄 Applying update...');
    this.showLoadingNotification('Updating app...');

    this.swUpdate.activateUpdate().then(() => {
      console.log('✅ Update applied successfully');
      // Reload the page to complete the update
      window.location.reload();
    }).catch(error => {
      console.error('❌ Error applying update:', error);
      this.showErrorNotification('Failed to apply update. Please refresh manually.');
    });
  }

  /**
   * Apply update silently in background
   */
  private applyUpdateSilently(): void {
    if (!this.updateAvailable) return;

    console.log('🔄 Applying update silently...');
    this.swUpdate.activateUpdate().then(() => {
      console.log('✅ Update applied silently - will take effect on next visit');
      this.showSuccessNotification('Update ready - refresh to apply');
    }).catch(error => {
      console.error('❌ Error applying silent update:', error);
    });
  }

  /**
   * Force check for updates (called manually)
   */
  forceUpdateCheck(): void {
    if (!this.swUpdate.isEnabled) {
      this.showErrorNotification('Updates not available in this environment');
      return;
    }

    console.log('🔄 Manual update check requested...');
    this.showLoadingNotification('Checking for updates...');
    
    this.checkForUpdates();
    
    setTimeout(() => {
      if (!this.updateAvailable) {
        this.showSuccessNotification('App is up to date!');
      }
    }, 3000);
  }

  /**
   * Get current update status
   */
  getUpdateStatus(): { available: boolean; enabled: boolean } {
    return {
      available: this.updateAvailable,
      enabled: this.swUpdate.isEnabled
    };
  }

  /**
   * Show loading notification
   */
  private showLoadingNotification(message: string): void {
    this.snackBar.open(`⏳ ${message}`, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show success notification
   */
  private showSuccessNotification(message: string): void {
    this.snackBar.open(`✅ ${message}`, 'OK', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error notification
   */
  private showErrorNotification(message: string): void {
    this.snackBar.open(`❌ ${message}`, 'OK', {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }
}