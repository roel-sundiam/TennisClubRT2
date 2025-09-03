import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

interface Suggestion {
  _id: string;
  userId: string;
  user?: {
    fullName: string;
    username: string;
  };
  type: 'suggestion' | 'complaint';
  category: 'facility' | 'service' | 'booking' | 'payments' | 'general' | 'staff' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  status: 'open' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
  isAnonymous: boolean;
  adminResponse?: {
    responderId: string;
    responder?: {
      fullName: string;
      username: string;
    };
    response: string;
    responseDate: Date;
    actionTaken?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface DialogData {
  suggestion: Suggestion;
}

@Component({
  selector: 'app-admin-response-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="response-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ getSuggestionIcon() }}</mat-icon>
          {{ data.suggestion.adminResponse ? 'Update' : 'Add' }} Official Response
        </h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Suggestion Details -->
        <div class="suggestion-summary">
          <div class="summary-header">
            <h3>{{ data.suggestion.title }}</h3>
            <div class="summary-badges">
              <span class="type-badge" [class]="data.suggestion.type">
                {{ data.suggestion.type | titlecase }}
              </span>
              <span class="priority-badge" [class]="data.suggestion.priority">
                {{ data.suggestion.priority | titlecase }}
              </span>
              <span class="status-badge" [class]="data.suggestion.status">
                {{ getStatusLabel(data.suggestion.status) }}
              </span>
            </div>
          </div>
          
          <div class="summary-meta">
            <div class="meta-item">
              <mat-icon>person</mat-icon>
              <span *ngIf="!data.suggestion.isAnonymous">{{ data.suggestion.user?.fullName || 'Unknown User' }}</span>
              <span *ngIf="data.suggestion.isAnonymous" class="anonymous-text">Anonymous User</span>
            </div>
            <div class="meta-item">
              <mat-icon>category</mat-icon>
              <span>{{ getCategoryLabel(data.suggestion.category) }}</span>
            </div>
            <div class="meta-item">
              <mat-icon>schedule</mat-icon>
              <span>{{ formatDate(data.suggestion.createdAt) }}</span>
            </div>
          </div>
          
          <div class="suggestion-description">
            <p>{{ data.suggestion.description }}</p>
          </div>

          <!-- Existing Response (if updating) -->
          <div *ngIf="data.suggestion.adminResponse" class="existing-response">
            <div class="existing-response-header">
              <mat-icon>history</mat-icon>
              <h4>Current Response</h4>
            </div>
            <div class="existing-response-content">
              <p>{{ data.suggestion.adminResponse.response }}</p>
              <div *ngIf="data.suggestion.adminResponse.actionTaken" class="action-taken">
                <strong>Action Taken:</strong> {{ data.suggestion.adminResponse.actionTaken }}
              </div>
              <div class="response-meta">
                <span>{{ data.suggestion.adminResponse.responder?.fullName }} • </span>
                <span>{{ formatDate(data.suggestion.adminResponse.responseDate) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Response Form -->
        <div class="response-form">
          <h3>
            <mat-icon>reply</mat-icon>
            {{ data.suggestion.adminResponse ? 'Update Your Response' : 'Your Official Response' }}
          </h3>
          
          <form [formGroup]="responseForm" (ngSubmit)="onSubmit()">
            <!-- Response Text -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Official Response</mat-label>
              <textarea matInput formControlName="response" 
                        rows="4"
                        placeholder="Provide your official response to this {{ data.suggestion.type }}..."></textarea>
              <mat-hint>{{ responseForm.get('response')?.value?.length || 0 }}/2000 characters</mat-hint>
              <mat-error *ngIf="responseForm.get('response')?.hasError('required')">
                Response is required
              </mat-error>
              <mat-error *ngIf="responseForm.get('response')?.hasError('minlength')">
                Response must be at least 5 characters long
              </mat-error>
              <mat-error *ngIf="responseForm.get('response')?.hasError('maxlength')">
                Response cannot exceed 2000 characters
              </mat-error>
            </mat-form-field>

            <!-- Action Taken -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Action Taken (Optional)</mat-label>
              <textarea matInput formControlName="actionTaken" 
                        rows="2"
                        placeholder="Describe any specific actions taken to address this feedback..."></textarea>
              <mat-hint>{{ responseForm.get('actionTaken')?.value?.length || 0 }}/500 characters</mat-hint>
              <mat-error *ngIf="responseForm.get('actionTaken')?.hasError('maxlength')">
                Action taken cannot exceed 500 characters
              </mat-error>
            </mat-form-field>

            <!-- Status Update -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Update Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="in_review">In Review - Investigating the matter</mat-option>
                <mat-option value="in_progress">In Progress - Taking action</mat-option>
                <mat-option value="resolved">Resolved - Issue has been addressed</mat-option>
                <mat-option value="closed">Closed - No further action needed</mat-option>
              </mat-select>
              <mat-hint>Choose the appropriate status after providing your response</mat-hint>
            </mat-form-field>
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button mat-dialog-close class="cancel-button">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        
        <div class="action-buttons">
          <button mat-button 
                  color="accent"
                  (click)="onSubmitAndKeepOpen()"
                  [disabled]="responseForm.invalid || submitting">
            <mat-icon *ngIf="!submitting">save</mat-icon>
            <mat-spinner *ngIf="submitting" diameter="16"></mat-spinner>
            {{ submitting ? 'Saving...' : 'Save & Continue' }}
          </button>
          
          <button mat-raised-button 
                  color="primary" 
                  (click)="onSubmit()"
                  [disabled]="responseForm.invalid || submitting">
            <mat-icon *ngIf="!submitting">send</mat-icon>
            <mat-spinner *ngIf="submitting" diameter="16"></mat-spinner>
            {{ submitting ? 'Submitting...' : (data.suggestion.adminResponse ? 'Update Response' : 'Submit Response') }}
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  styleUrl: './admin-response-dialog.component.scss'
})
export class AdminResponseDialogComponent implements OnDestroy {
  private apiUrl = 'http://localhost:3000/api';
  private subscription = new Subscription();

  responseForm: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AdminResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Initialize form with existing response data if available
    const existingResponse = this.data.suggestion.adminResponse;
    
    this.responseForm = this.fb.group({
      response: [
        existingResponse?.response || '', 
        [Validators.required, Validators.minLength(5), Validators.maxLength(2000)]
      ],
      actionTaken: [
        existingResponse?.actionTaken || '', 
        [Validators.maxLength(500)]
      ],
      status: [
        this.data.suggestion.status === 'open' ? 'in_review' : this.data.suggestion.status,
        [Validators.required]
      ]
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSubmit(): void {
    this.submitResponse(true);
  }

  onSubmitAndKeepOpen(): void {
    this.submitResponse(false);
  }

  private submitResponse(closeDialog: boolean): void {
    if (this.responseForm.invalid) {
      return;
    }

    this.submitting = true;
    const formData = this.responseForm.value;

    this.subscription.add(
      this.http.post<any>(`${this.apiUrl}/suggestions/${this.data.suggestion._id}/response`, formData).subscribe({
        next: (response) => {
          if (response.success) {
            const action = this.data.suggestion.adminResponse ? 'updated' : 'added';
            this.showMessage(`Response ${action} successfully!`, 'success');
            
            if (closeDialog) {
              this.dialogRef.close(response.data);
            } else {
              // Update the suggestion data with the new response
              this.data.suggestion = response.data;
              this.showMessage('You can continue editing or close this dialog', 'success');
            }
          } else {
            this.showMessage('Failed to submit response', 'error');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error submitting response:', error);
          this.showMessage('Failed to submit response', 'error');
          this.submitting = false;
        }
      })
    );
  }

  getSuggestionIcon(): string {
    return this.data.suggestion.type === 'complaint' ? 'report_problem' : 'lightbulb';
  }

  getCategoryLabel(category: string): string {
    const categoryMap: Record<string, string> = {
      facility: 'Facility',
      service: 'Service',
      booking: 'Booking',
      payments: 'Payments',
      staff: 'Staff',
      maintenance: 'Maintenance',
      general: 'General'
    };
    return categoryMap[category] || category;
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      open: 'Open',
      in_review: 'Under Review',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    const config = {
      duration: 4000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center' as const,
      verticalPosition: 'bottom' as const
    };

    this.snackBar.open(message, 'Close', config);
  }
}