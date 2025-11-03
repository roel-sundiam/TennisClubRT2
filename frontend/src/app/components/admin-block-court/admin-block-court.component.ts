import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface BlockedReservation {
  _id: string;
  date: Date;
  timeSlot: number;
  duration: number;
  timeSlotDisplay: string;
  blockReason: string;
  blockNotes: string;
  userId?: {
    fullName: string;
    username: string;
  };
  createdAt: Date;
}

@Component({
  selector: 'app-admin-block-court',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './admin-block-court.component.html',
  styleUrls: ['./admin-block-court.component.scss']
})
export class AdminBlockCourtComponent implements OnInit {
  blockForm: FormGroup;
  blockedReservations: BlockedReservation[] = [];
  loading = false;
  submitting = false;
  editingBlock: BlockedReservation | null = null;
  showDeleteModal = false;
  blockToDelete: BlockedReservation | null = null;
  displayedColumns = ['date', 'time', 'duration', 'reason', 'notes', 'createdBy', 'actions'];

  timeSlots: Array<{ value: number; label: string }> = [];
  durations = [
    { value: 1, label: '1 hour' },
    { value: 2, label: '2 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 5, label: '5 hours' },
    { value: 6, label: '6 hours' },
    { value: 7, label: '7 hours' },
    { value: 8, label: '8 hours' },
    { value: 9, label: '9 hours' },
    { value: 10, label: '10 hours' },
    { value: 11, label: '11 hours' },
    { value: 12, label: '12 hours' }
  ];

  blockReasons = [
    { value: 'maintenance', label: '🔧 Maintenance', icon: 'build' },
    { value: 'private_event', label: '🎉 Private Event', icon: 'event' },
    { value: 'weather', label: '🌧️ Weather', icon: 'cloud' },
    { value: 'other', label: '📝 Other', icon: 'info' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.blockForm = this.fb.group({
      date: ['', Validators.required],
      timeSlot: ['', Validators.required],
      duration: [1, Validators.required],
      blockReason: ['maintenance', Validators.required],
      blockNotes: ['', Validators.maxLength(200)]
    });

    // Initialize time slots (5 AM to 10 PM)
    for (let hour = 5; hour <= 22; hour++) {
      const label = this.formatTimeSlot(hour);
      this.timeSlots.push({ value: hour, label });
    }
  }

  ngOnInit(): void {
    // Check if user is admin or superadmin
    if (!this.authService.isAdmin() && !this.authService.isSuperAdmin()) {
      this.snackBar.open('Access denied. Admin only.', 'Close', { duration: 3000 });
      this.router.navigate(['/dashboard']);
      return;
    }

    // Set default date to today
    this.blockForm.patchValue({
      date: new Date()
    });

    this.loadBlockedReservations();
  }

  formatTimeSlot(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  formatTimeRange(start: number, duration: number): string {
    const end = start + duration;
    return `${this.formatTimeSlot(start)} - ${this.formatTimeSlot(end)}`;
  }

  getReasonIcon(reason: string): string {
    const reasonObj = this.blockReasons.find(r => r.value === reason);
    return reasonObj?.icon || 'info';
  }

  getReasonLabel(reason: string): string {
    const reasonObj = this.blockReasons.find(r => r.value === reason);
    return reasonObj?.label || reason;
  }

  loadBlockedReservations(): void {
    this.loading = true;

    this.http.get<any>(`${environment.apiUrl}/reservations/admin/blocks`).subscribe({
      next: (response) => {
        this.blockedReservations = response.data || [];
        this.loading = false;
        console.log(`📋 Loaded ${this.blockedReservations.length} blocked reservations`);
      },
      error: (error) => {
        console.error('Failed to load blocked reservations:', error);
        this.snackBar.open('Failed to load blocked reservations', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  submitBlock(): void {
    if (!this.blockForm.valid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;

    const formValue = this.blockForm.value;

    // Format date in YYYY-MM-DD using local date components to avoid timezone shift
    const selectedDate = formValue.date;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const payload = {
      date: dateString,
      timeSlot: formValue.timeSlot,
      duration: formValue.duration,
      blockReason: formValue.blockReason,
      blockNotes: formValue.blockNotes || ''
    };

    // Update existing block or create new one
    const request = this.editingBlock
      ? this.http.put<any>(`${environment.apiUrl}/reservations/admin/block/${this.editingBlock._id}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/reservations/admin/block`, payload);

    request.subscribe({
      next: (response) => {
        this.snackBar.open(
          response.message || (this.editingBlock ? 'Block updated successfully' : 'Court successfully blocked'),
          'Close',
          { duration: 4000 }
        );
        this.resetForm();
        this.loadBlockedReservations();
        this.submitting = false;
      },
      error: (error) => {
        console.error('Failed to save block:', error);
        const errorMsg = error.error?.error || 'Failed to save block';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        this.submitting = false;
      }
    });
  }

  editBlock(block: BlockedReservation): void {
    this.editingBlock = block;
    this.blockForm.patchValue({
      date: new Date(block.date),
      timeSlot: block.timeSlot,
      duration: block.duration,
      blockReason: block.blockReason,
      blockNotes: block.blockNotes || ''
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingBlock = null;
    this.resetForm();
  }

  deleteBlock(block: BlockedReservation): void {
    this.blockToDelete = block;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.blockToDelete = null;
  }

  confirmDeleteBlock(): void {
    if (!this.blockToDelete) return;

    this.http.delete<any>(`${environment.apiUrl}/reservations/admin/block/${this.blockToDelete._id}`).subscribe({
      next: (response) => {
        this.snackBar.open(
          response.message || 'Block removed successfully',
          'Close',
          { duration: 3000 }
        );
        this.closeDeleteModal();
        this.loadBlockedReservations();
      },
      error: (error) => {
        console.error('Failed to delete block:', error);
        const errorMsg = error.error?.error || 'Failed to remove block';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        this.closeDeleteModal();
      }
    });
  }

  resetForm(): void {
    this.editingBlock = null;
    this.blockForm.reset({
      date: new Date(),
      duration: 1,
      blockReason: 'maintenance'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
