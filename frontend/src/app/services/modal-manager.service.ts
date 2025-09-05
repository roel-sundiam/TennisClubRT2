import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OpenPlayNotificationModalComponent } from '../components/open-play-notification-modal/open-play-notification-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalManagerService {
  private activeOpenPlayModal: MatDialogRef<OpenPlayNotificationModalComponent> | null = null;
  private isOpenPlayModalPending = false;
  private pendingTimeout: any = null;

  constructor(private dialog: MatDialog) {}

  /**
   * Show Open Play notification modal with deduplication
   */
  showOpenPlayModal(data: any, config: any = {}): MatDialogRef<OpenPlayNotificationModalComponent> | null {
    // Prevent multiple modals from opening
    if (this.activeOpenPlayModal || this.isOpenPlayModalPending) {
      console.log('🎾 ModalManager: Open Play modal already active, skipping duplicate');
      return null;
    }

    console.log('🎾 ModalManager: Opening Open Play modal');
    this.isOpenPlayModalPending = true;

    // Clear any existing timeout
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    const modalConfig = {
      width: '90vw',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '80vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: ['open-play-modal'],
      ...config
    };

    // Small delay to prevent race conditions with timeout safety
    this.pendingTimeout = setTimeout(() => {
      if (this.isOpenPlayModalPending) {
        this.activeOpenPlayModal = this.dialog.open(OpenPlayNotificationModalComponent, {
          data,
          ...modalConfig
        });

        this.isOpenPlayModalPending = false;
        this.pendingTimeout = null;

        // Clean up when modal is closed
        this.activeOpenPlayModal.afterClosed().subscribe(() => {
          console.log('🎾 ModalManager: Open Play modal closed');
          this.activeOpenPlayModal = null;
        });
      }
    }, 100);

    return this.activeOpenPlayModal;
  }

  /**
   * Close active Open Play modal if one exists
   */
  closeOpenPlayModal(result?: any): void {
    if (this.activeOpenPlayModal) {
      console.log('🎾 ModalManager: Closing active Open Play modal');
      this.activeOpenPlayModal.close(result);
      this.activeOpenPlayModal = null;
    }
    
    // Clear pending state and timeout
    this.isOpenPlayModalPending = false;
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  /**
   * Check if an Open Play modal is currently active
   */
  isOpenPlayModalActive(): boolean {
    return this.activeOpenPlayModal !== null || this.isOpenPlayModalPending;
  }

  /**
   * Get the active Open Play modal reference
   */
  getActiveOpenPlayModal(): MatDialogRef<OpenPlayNotificationModalComponent> | null {
    return this.activeOpenPlayModal;
  }
}