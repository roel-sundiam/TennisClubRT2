import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface Member {
  _id: string;
  fullName: string;
  username: string;
}

interface PlayerPayment {
  playerName: string;
  amount: number;
}

interface ManualCourtUsageSession {
  date: Date;
  timeSlot: number;
  startTime?: number;
  endTime?: number;
  players: Array<{ playerName: string; amount: number; status: string }>;
  totalAmount: number;
  createdBy: string;
  createdAt: Date;
  description: string;
  playerNames?: string[];
}

@Component({
  selector: 'app-admin-manual-court-usage',
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
    MatAutocompleteModule,
    MatChipsModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './admin-manual-court-usage.component.html',
  styleUrls: ['./admin-manual-court-usage.component.scss']
})
export class AdminManualCourtUsageComponent implements OnInit {
  courtUsageForm: FormGroup;
  members: Member[] = [];
  filteredMembers: Member[] = [];
  selectedPlayers: string[] = [];
  playerPayments: PlayerPayment[] = [];
  timeSlots: Array<{ value: number; label: string; isPeak: boolean }> = [];
  loading = false;
  calculating = false;
  history: ManualCourtUsageSession[] = [];
  displayedColumns = ['playerName', 'amount', 'actions'];
  historyColumns = ['date', 'timeSlot', 'players', 'totalAmount'];

  // Peak hours configuration
  peakHours = [5, 18, 19, 20, 21]; // 5AM, 6PM, 7PM, 8PM, 9PM
  peakHourFee = 100;
  offPeakFeePerMember = 20;
  offPeakFeePerNonMember = 50;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.courtUsageForm = this.fb.group({
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      playerInput: [''],
      description: ['']
    });

    // Initialize time slots (5 AM to 11 PM for start, 6 AM to 12 AM for end)
    for (let hour = 5; hour <= 23; hour++) {
      const isPeak = this.peakHours.includes(hour);
      const label = this.formatTimeSlot(hour);
      this.timeSlots.push({
        value: hour,
        label: isPeak ? `${label} (Peak)` : label,
        isPeak
      });
    }
  }

  ngOnInit(): void {
    // Check if user is superadmin
    if (!this.authService.isSuperAdmin()) {
      this.snackBar.open('Access denied. Superadmin only.', 'Close', { duration: 3000 });
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadMembers();
    this.loadHistory();

    // Set default date to today
    this.courtUsageForm.patchValue({
      date: new Date()
    });
  }

  formatTimeSlot(hour: number | ManualCourtUsageSession): string {
    // Handle session object with startTime/endTime
    if (typeof hour === 'object') {
      const session = hour;

      // If no time data available, show "Not recorded"
      if (session.startTime === null || session.startTime === undefined) {
        return 'Not recorded';
      }

      const startTime = session.startTime;
      const endTime = session.endTime ?? startTime + 1;

      return `${this.format24Hour(startTime)} - ${this.format24Hour(endTime)}`;
    }

    // Handle single hour (for dropdown)
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  format24Hour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  loadMembers(): void {
    // Request all members - backend max limit is 100, so we'll need to paginate if there are more
    this.http.get<any>(`${environment.apiUrl}/members?limit=100`).subscribe({
      next: (response) => {
        this.members = response.data || response;
        this.filteredMembers = [...this.members]; // Show all members initially
        console.log(`Loaded ${this.members.length} members out of ${response.pagination?.total || this.members.length} total`);

        // If there are more members, load them all
        if (response.pagination && response.pagination.total > this.members.length) {
          this.loadAllMembers(response.pagination.total);
        }
      },
      error: (error) => {
        console.error('Failed to load members:', error);
        this.snackBar.open('Failed to load members', 'Close', { duration: 3000 });
      }
    });
  }

  loadAllMembers(total: number): void {
    const pages = Math.ceil(total / 100);
    const requests = [];

    for (let page = 2; page <= pages; page++) {
      requests.push(
        this.http.get<any>(`${environment.apiUrl}/members?limit=100&page=${page}`)
      );
    }

    if (requests.length > 0) {
      Promise.all(requests.map(req => req.toPromise())).then(responses => {
        responses.forEach(response => {
          if (response && response.data) {
            this.members.push(...response.data);
          }
        });
        this.filteredMembers = [...this.members];
        console.log(`Total members loaded: ${this.members.length}`);
      });
    }
  }

  loadHistory(): void {
    this.http.get<any>(`${environment.apiUrl}/manual-court-usage`).subscribe({
      next: (response) => {
        this.history = response.data?.sessions || [];
        console.log('📊 Loaded history sessions:', this.history.length);
      },
      error: (error) => {
        console.error('Failed to load history:', error);
      }
    });
  }

  onPlayerInputChange(event: any): void {
    const value = event.target.value.toLowerCase().trim();
    if (value.length > 0) {
      this.filteredMembers = this.members.filter(member =>
        member.fullName.toLowerCase().includes(value)
      );
    } else {
      this.filteredMembers = [...this.members]; // Show all members when input is cleared
    }
  }

  onMemberSelected(event: any): void {
    const playerName = event.option.value;
    if (!this.selectedPlayers.includes(playerName)) {
      this.selectedPlayers.push(playerName);
    }
    this.courtUsageForm.patchValue({ playerInput: '' });
    this.filteredMembers = [...this.members]; // Reset to show all members
  }

  addManualPlayer(): void {
    const playerName = this.courtUsageForm.get('playerInput')?.value?.trim();
    if (playerName && !this.selectedPlayers.includes(playerName)) {
      this.selectedPlayers.push(playerName);
      this.courtUsageForm.patchValue({ playerInput: '' });
      this.filteredMembers = [...this.members]; // Reset to show all members
    }
  }

  removePlayer(playerName: string): void {
    // Remove from selected players
    this.selectedPlayers = this.selectedPlayers.filter(p => p !== playerName);

    // Remove from player payments and trigger change detection
    this.playerPayments = this.playerPayments.filter(p => p.playerName !== playerName);
  }

  calculateFees(): void {
    if (this.selectedPlayers.length === 0) {
      this.snackBar.open('Please add at least one player', 'Close', { duration: 3000 });
      return;
    }

    const startTime = this.courtUsageForm.get('startTime')?.value;
    const endTime = this.courtUsageForm.get('endTime')?.value;

    if (!startTime || !endTime) {
      this.snackBar.open('Please select start and end time', 'Close', { duration: 3000 });
      return;
    }

    if (endTime <= startTime) {
      this.snackBar.open('End time must be after start time', 'Close', { duration: 3000 });
      return;
    }

    this.calculating = true;

    // Categorize players as members or non-members
    let memberCount = 0;
    let nonMemberCount = 0;

    const memberNames = this.members.map(m => m.fullName.toLowerCase().trim());

    this.selectedPlayers.forEach(playerName => {
      const cleanName = playerName.toLowerCase().trim();
      if (memberNames.includes(cleanName)) {
        memberCount++;
      } else {
        nonMemberCount++;
      }
    });

    // Calculate total fee for all hours in the range
    let totalFee = 0;
    const hours = endTime - startTime;

    for (let hour = startTime; hour < endTime; hour++) {
      const isPeakHour = this.peakHours.includes(hour);

      if (isPeakHour) {
        const calculatedFee = (memberCount * this.offPeakFeePerMember) + (nonMemberCount * this.offPeakFeePerNonMember);
        totalFee += Math.max(this.peakHourFee, calculatedFee);
      } else {
        totalFee += (memberCount * this.offPeakFeePerMember) + (nonMemberCount * this.offPeakFeePerNonMember);
      }
    }

    // Divide equally among players
    const feePerPlayer = totalFee / this.selectedPlayers.length;

    // Create player payments
    this.playerPayments = this.selectedPlayers.map(playerName => ({
      playerName,
      amount: parseFloat(feePerPlayer.toFixed(2))
    }));

    this.calculating = false;

    this.snackBar.open(
      `Calculated: ₱${totalFee} total for ${hours} hour(s) (₱${feePerPlayer.toFixed(2)} per player)`,
      'Close',
      { duration: 4000 }
    );
  }

  updatePlayerAmount(playerName: string, newAmount: string): void {
    // Create new array to trigger change detection
    this.playerPayments = this.playerPayments.map(p => {
      if (p.playerName === playerName) {
        return { ...p, amount: parseFloat(newAmount) || 0 };
      }
      return p;
    });
  }

  getTotalAmount(): number {
    return this.playerPayments.reduce((sum, p) => sum + p.amount, 0);
  }

  canSubmit(): boolean {
    return this.courtUsageForm.valid &&
           this.playerPayments.length > 0 &&
           this.playerPayments.every(p => p.amount > 0);
  }

  submitCourtUsage(): void {
    if (!this.canSubmit()) {
      this.snackBar.open('Please fill all required fields and calculate fees', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    const formValue = this.courtUsageForm.value;
    const payload = {
      date: formValue.date,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      players: this.playerPayments,
      description: formValue.description || undefined
    };

    this.http.post<any>(`${environment.apiUrl}/manual-court-usage`, payload).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Successfully created ${response.data.totalPlayers} pending payment(s)`,
          'Close',
          { duration: 4000 }
        );
        this.resetForm();
        this.loadHistory();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to create court usage:', error);
        const errorMsg = error.error?.error || 'Failed to create court usage';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.courtUsageForm.reset({
      date: new Date()
    });
    this.selectedPlayers = [];
    this.playerPayments = [];
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getPlayersList(session: ManualCourtUsageSession | any[] | any): string {
    // Handle array of players (old format)
    if (Array.isArray(session)) {
      return session.map(p => p.playerName).join(', ');
    }

    // Use playerNames array (populated by backend)
    if (session.playerNames && session.playerNames.length > 0) {
      return session.playerNames.join(', ');
    }

    // Fallback to players array
    if (session.players && session.players.length > 0) {
      return session.players.map((p: any) => p.playerName).join(', ');
    }

    return 'No players';
  }

  // Get initials from a name for avatars
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Get total number of unique players from history
  getTotalPlayers(): number {
    const uniquePlayers = new Set<string>();
    this.history.forEach(session => {
      session.players.forEach((player: any) => {
        uniquePlayers.add(player.playerName);
      });
    });
    return uniquePlayers.size;
  }

  // Get total revenue from all history sessions
  getTotalRevenue(): string {
    const total = this.history.reduce((sum, session) => sum + session.totalAmount, 0);
    return total.toFixed(2);
  }
}

