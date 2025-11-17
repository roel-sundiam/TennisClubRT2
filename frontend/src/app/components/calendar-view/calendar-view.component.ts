import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput, Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarService, DayReservationInfo, Reservation } from '../../services/calendar.service';
import { CalendarDayDetailsDialogComponent } from '../calendar-day-details-dialog/calendar-day-details-dialog.component';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FullCalendarModule
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CalendarViewComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  loading = true;
  monthData: Map<string, DayReservationInfo> = new Map();
  isInitialLoad = true;
  private isRefetching = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next'
    },
    height: 'auto',
    fixedWeekCount: false,
    showNonCurrentDates: false,
    eventOrder: 'order,start', // Sort by our custom 'order' property, then by start time
    events: (fetchInfo, successCallback, failureCallback) => {
      // Return current events from monthData
      const events: EventInput[] = [];
      this.monthData.forEach((dayInfo, dateKey) => {
        // Add reservation events
        dayInfo.reservations.forEach(reservation => {
          if (reservation.status === 'confirmed' || reservation.status === 'pending' || reservation.status === 'blocked') {
            // For blocked reservations, show the block notes (full description) as title
            let title = '';
            if (reservation.status === 'blocked') {
              title = `🎉 ${reservation.blockNotes || reservation.blockReason || 'Court Blocked'}`;
            } else {
              const startTime = this.formatTimeSlot(reservation.timeSlot);
              title = `${this.getReserverName(reservation)} (${startTime})(${reservation.duration}h)`;
            }

            // Determine colors based on status
            let bgColor = '#4caf50'; // confirmed - green
            let borderColor = '#4caf50';
            if (reservation.status === 'pending') {
              bgColor = '#ff9800'; // pending - orange
              borderColor = '#ff9800';
            } else if (reservation.status === 'blocked') {
              bgColor = '#9e9e9e'; // blocked - gray
              borderColor = '#9e9e9e';
            }

            // Ensure we have a valid timeSlot for ordering
            const eventOrder = reservation.timeSlot || 0;

            // Create a timed event using the timeSlot for proper ordering
            const timeSlotValue = reservation.timeSlot || 0;
            const startDateTime = `${dateKey}T${String(timeSlotValue).padStart(2, '0')}:00:00`;

            events.push({
              id: reservation._id,
              title: title,
              start: startDateTime,
              allDay: false,  // Must be false for time-based sorting
              backgroundColor: bgColor,
              borderColor: borderColor,
              color: bgColor, // Also set color property
              textColor: 'white', // Ensure text is white
              order: eventOrder, // Explicit ordering for FullCalendar
              extendedProps: {
                reservation: reservation,
                hours: reservation.duration,
                timeSlot: reservation.timeSlot,
                bgColor: bgColor, // Store color in extendedProps as fallback
                status: reservation.status
              }
            });
          }
        });

        // Add Wednesday Homeowner's Day indicator as a regular event (not background)
        if (dayInfo.isWednesday) {
          // Create timed event at 6 PM (18:00) for proper ordering
          const homeownerDateTime = `${dateKey}T18:00:00`;

          events.push({
            title: 'Homeowner',
            start: homeownerDateTime,
            allDay: false,  // Must be false for time-based sorting
            backgroundColor: '#8b5cf6',
            borderColor: '#8b5cf6',
            color: '#8b5cf6', // Also set color property
            textColor: 'white', // Ensure text is white
            order: 18, // Explicit ordering for FullCalendar
            classNames: ['homeowner-event'], // Add custom class for styling
            extendedProps: {
              isWednesday: true,
              timeSlot: 18,  // 6 PM - for sorting purposes
              bgColor: '#8b5cf6',
              status: 'wednesday'
            }
          });
        }
      });

      // Sort events by timeSlot to show them in chronological order
      events.sort((a, b) => {
        const timeA = a.extendedProps?.reservation?.timeSlot ?? a.extendedProps?.timeSlot ?? 999;
        const timeB = b.extendedProps?.reservation?.timeSlot ?? b.extendedProps?.timeSlot ?? 999;
        return timeA - timeB;
      });

      successCallback(events);
    },
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    eventDidMount: this.handleEventDidMount.bind(this),
    // Custom button handlers for navigation
    customButtons: {
      prev: {
        text: 'prev',
        click: () => this.handlePrevMonth()
      },
      next: {
        text: 'next',
        click: () => this.handleNextMonth()
      }
    },
    eventContent: this.renderEventContent.bind(this)
  };

  constructor(
    private calendarService: CalendarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Loading starts as true, load initial data
    this.loadMonthData(new Date());
  }

  /**
   * Load reservation data for current month
   */
  loadMonthData(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${month}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });


    // Set loading immediately but schedule change detection
    this.loading = true;
    setTimeout(() => this.cdr.detectChanges(), 0);

    this.calendarService.getMonthReservations(year, month).subscribe({
      next: (data) => {
        this.monthData = data;

        // Refetch events to update calendar display
        if (this.calendarComponent) {
          const calendarApi = this.calendarComponent.getApi();

          // Log current view date before refetch
          const currentView = calendarApi.view.currentStart;

          calendarApi.refetchEvents();

          // Check view immediately after refetch
          setTimeout(() => {
            const afterView = calendarApi.view.currentStart;
          }, 50);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  /**
   * Handle previous month button
   */
  handlePrevMonth(): void {
    if (!this.calendarComponent) return;

    const calendarApi = this.calendarComponent.getApi();
    const currentDate = calendarApi.view.currentStart;

    // Calculate previous month
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);


    // Load data first, then navigate
    this.loadMonthDataThenNavigate(prevMonth, 'prev');
  }

  /**
   * Handle next month button
   */
  handleNextMonth(): void {
    if (!this.calendarComponent) return;

    const calendarApi = this.calendarComponent.getApi();
    const currentDate = calendarApi.view.currentStart;

    // Calculate next month
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);


    // Load data first, then navigate
    this.loadMonthDataThenNavigate(nextMonth, 'next');
  }

  /**
   * Load month data, then navigate calendar
   */
  private loadMonthDataThenNavigate(date: Date, direction: 'prev' | 'next'): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    this.loading = true;
    setTimeout(() => this.cdr.detectChanges(), 0);

    this.calendarService.getMonthReservations(year, month).subscribe({
      next: (data) => {
        this.monthData = data;

        // Now navigate the calendar with the new data loaded
        if (this.calendarComponent) {
          const calendarApi = this.calendarComponent.getApi();

          // Use gotoDate to jump directly to the target month
          calendarApi.gotoDate(date);

          const viewDate = calendarApi.view.currentStart;

          // Refetch events with new data
          calendarApi.refetchEvents();
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Handle event click (reservation clicked) - Show day details in dialog
   */
  handleEventClick(arg: EventClickArg): void {
    // Get the date from the event
    const eventDate = arg.event.start || new Date();
    const dateKey = this.calendarService.getDateKey(eventDate);
    const dayInfo = this.monthData.get(dateKey);

    if (dayInfo) {
      this.dialog.open(CalendarDayDetailsDialogComponent, {
        width: '700px',
        maxWidth: '95vw',
        data: {
          date: eventDate,
          dayInfo: dayInfo
        }
      });
    }
  }

  /**
   * Handle date cell click - Show day details in dialog
   */
  handleDateClick(arg: any): void {
    const clickedDate = arg.date;
    const dateKey = this.calendarService.getDateKey(clickedDate);
    const dayInfo = this.monthData.get(dateKey);

    if (dayInfo) {
      this.dialog.open(CalendarDayDetailsDialogComponent, {
        width: '700px',
        maxWidth: '95vw',
        data: {
          date: clickedDate,
          dayInfo: dayInfo
        }
      });
    }
  }

  /**
   * Custom event content renderer
   */
  renderEventContent(arg: any): any {
    const hours = arg.event.extendedProps['hours'];
    if (hours) {
      return {
        html: `
          <div class="fc-event-main-frame">
            <div class="fc-event-title-container">
              <div class="fc-event-title">${arg.event.title}</div>
            </div>
          </div>
        `
      };
    }
    return { html: arg.event.title };
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigate to reservations with today's date
   */
  bookToday(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    this.router.navigate(['/reservations'], {
      queryParams: { date: dateStr }
    });
  }

  /**
   * Get reserver name from reservation
   */
  getReserverName(reservation: Reservation): string {
    return this.calendarService.getReserverName(reservation);
  }

  /**
   * Debug method: Get all blocked reservations
   */
  getBlockedReservationsDebug(): any[] {
    const blocked: any[] = [];
    this.monthData.forEach((dayInfo, dateKey) => {
      dayInfo.reservations.forEach(reservation => {
        if (reservation.status === 'blocked') {
          blocked.push({
            date: dateKey,
            status: reservation.status,
            reason: reservation.blockReason || 'N/A',
            notes: reservation.blockNotes || 'N/A',
            timeSlot: reservation.timeSlot,
            endTimeSlot: reservation.endTimeSlot,
            duration: reservation.duration
          });
        }
      });
    });
    return blocked;
  }

  /**
   * Debug method: Get total reservations count
   */
  getTotalReservationsCount(): number {
    let count = 0;
    this.monthData.forEach((dayInfo) => {
      count += dayInfo.reservations.length;
    });
    return count;
  }

  /**
   * Handle event mounting - apply custom styles
   */
  handleEventDidMount(arg: any): void {
    const bgColor = arg.event.extendedProps.bgColor;
    if (bgColor && arg.el) {
      // Apply background color directly to the element
      arg.el.style.backgroundColor = bgColor;
      arg.el.style.borderColor = bgColor;
      arg.el.style.color = 'white';
      arg.el.style.opacity = '1';
      arg.el.style.visibility = 'visible';
    }
  }

  /**
   * Format time slot to 12-hour format with AM/PM
   */
  formatTimeSlot(timeSlot: number): string {
    if (timeSlot === 0) return '12AM';
    if (timeSlot < 12) return `${timeSlot}AM`;
    if (timeSlot === 12) return '12PM';
    return `${timeSlot - 12}PM`;
  }
}
