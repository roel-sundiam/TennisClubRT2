import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of, forkJoin } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface PaymentNotification {
  id: string;
  type: 'overdue' | 'due_soon' | 'due_today';
  title: string;
  message: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  reservationId: string;
  paymentId: string;
}

export interface OpenPlayNotification {
  id: string;
  type: 'open_play_new' | 'open_play_reminder' | 'open_play_closed' | 'matches_ready';
  title: string;
  message: string;
  eventDate: Date;
  startTime: number;
  endTime: number;
  confirmedPlayers: number;
  maxPlayers: number;
  pollId: string;
  hasVoted?: boolean;
  userVote?: string;
}

export type AppNotification = PaymentNotification | OpenPlayNotification;

export interface NotificationSummary {
  overdueCount: number;
  dueSoonCount: number;
  dueTodayCount: number;
  openPlayCount: number;
  totalCount: number;
  notifications: AppNotification[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;
  private notificationSubject = new BehaviorSubject<NotificationSummary>({
    overdueCount: 0,
    dueSoonCount: 0,
    dueTodayCount: 0,
    openPlayCount: 0,
    totalCount: 0,
    notifications: []
  });

  public notifications$ = this.notificationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Load notifications when user is authenticated
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Add a small delay to ensure token is properly set
        setTimeout(() => {
          this.loadNotifications();
        }, 100);
      } else {
        this.clearNotifications();
      }
    });
  }

  loadNotifications(): void {
    console.log('🔔 NotificationService.loadNotifications() called');
    console.log('🔔 isAuthenticated:', this.authService.isAuthenticated());
    console.log('🔔 token:', !!this.authService.token);
    console.log('🔔 currentUser:', this.authService.currentUser);
    
    if (!this.authService.isAuthenticated()) {
      console.log('🔔 Not authenticated, skipping notification load');
      return;
    }

    // Load both payment notifications and Open Play events using RxJS
    console.log('🔔 Making API calls with RxJS...');
    const payments$ = this.http.get<any>(`${this.apiUrl}/payments/my`).pipe(
      catchError(error => {
        console.error('🔔 Error loading payments:', error);
        return of({ data: [] });
      })
    );
    
    const openPlay$ = this.http.get<any>(`${this.apiUrl}/polls/active`).pipe(
      catchError(error => {
        console.error('🔔 Error loading open play:', error);
        return of({ data: [] });
      })
    );

    forkJoin([payments$, openPlay$]).subscribe({
      next: ([paymentResponse, pollResponse]) => {
        console.log('🔔 API responses received:', {
          payments: !!paymentResponse.data,
          polls: !!pollResponse.data
        });
        
        const payments = paymentResponse?.data || [];
        const polls = pollResponse?.data || [];
        
        const paymentNotifications = this.processPayments(payments);
        const openPlayNotifications = this.processOpenPlayEvents(polls);
        
        const combinedSummary: NotificationSummary = {
          overdueCount: paymentNotifications.overdueCount,
          dueSoonCount: paymentNotifications.dueSoonCount,
          dueTodayCount: paymentNotifications.dueTodayCount,
          openPlayCount: openPlayNotifications.length,
          totalCount: paymentNotifications.totalCount + openPlayNotifications.length,
          notifications: [...paymentNotifications.notifications, ...openPlayNotifications]
        };

        this.notificationSubject.next(combinedSummary);
      },
      error: (error) => {
        console.error('🔔 Error loading notifications:', error);
        this.clearNotifications();
      }
    });
  }

  private processPayments(payments: any[]): NotificationSummary {
    const notifications: PaymentNotification[] = [];
    let overdueCount = 0;
    let dueSoonCount = 0;
    let dueTodayCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    payments.forEach(payment => {
      // Only process pending payments
      if (payment.status !== 'pending') {
        return;
      }

      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      let notification: PaymentNotification | null = null;

      if (daysDiff < 0) {
        // Overdue
        overdueCount++;
        const daysOverdue = Math.abs(daysDiff);
        notification = {
          id: payment._id,
          type: 'overdue',
          title: 'Payment Overdue',
          message: `Payment of ₱${payment.amount} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          amount: payment.amount,
          dueDate: new Date(payment.dueDate),
          daysOverdue: daysOverdue,
          reservationId: payment.reservationId?._id || '',
          paymentId: payment._id
        };
      } else if (daysDiff === 0) {
        // Due today
        dueTodayCount++;
        notification = {
          id: payment._id,
          type: 'due_today',
          title: 'Payment Due Today',
          message: `Payment of ₱${payment.amount} is due today`,
          amount: payment.amount,
          dueDate: new Date(payment.dueDate),
          daysOverdue: 0,
          reservationId: payment.reservationId?._id || '',
          paymentId: payment._id
        };
      } else if (daysDiff <= 3) {
        // Due soon (within 3 days)
        dueSoonCount++;
        notification = {
          id: payment._id,
          type: 'due_soon',
          title: 'Payment Due Soon',
          message: `Payment of ₱${payment.amount} is due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`,
          amount: payment.amount,
          dueDate: new Date(payment.dueDate),
          daysOverdue: 0,
          reservationId: payment.reservationId?._id || '',
          paymentId: payment._id
        };
      }

      if (notification) {
        notifications.push(notification);
      }
    });

    // Sort notifications by priority: overdue first, then due today, then due soon
    notifications.sort((a, b) => {
      const priority = { 'overdue': 0, 'due_today': 1, 'due_soon': 2 };
      const aPriority = priority[a.type];
      const bPriority = priority[b.type];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same priority, sort by due date (earliest first)
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return {
      overdueCount,
      dueSoonCount,
      dueTodayCount,
      openPlayCount: 0,
      totalCount: overdueCount + dueSoonCount + dueTodayCount,
      notifications
    };
  }

  private processOpenPlayEvents(polls: any[]): OpenPlayNotification[] {
    const notifications: OpenPlayNotification[] = [];
    const userId = this.authService.currentUser?._id;

    polls.forEach(poll => {
      // Only process Open Play polls
      if (poll.metadata?.category !== 'open_play' || !poll.openPlayEvent) {
        return;
      }

      const eventDate = new Date(poll.openPlayEvent.eventDate);
      const now = new Date();
      const timeDiff = eventDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Check if user has voted
      const hasVoted = userId && poll.options.some((option: any) => 
        option.voters.includes(userId)
      );
      
      let userVote = null;
      if (hasVoted && userId) {
        const votedOption = poll.options.find((option: any) => 
          option.voters.includes(userId)
        );
        userVote = votedOption?.text;
      }

      let notification: OpenPlayNotification | null = null;

      if (poll.status === 'active' && !hasVoted && daysDiff >= 0) {
        // New Open Play event, user hasn't voted
        notification = {
          id: poll._id,
          type: 'open_play_new',
          title: 'New Open Play Event!',
          message: `${poll.title} - Vote to join!`,
          eventDate,
          startTime: poll.openPlayEvent.startTime,
          endTime: poll.openPlayEvent.endTime,
          confirmedPlayers: poll.openPlayEvent.confirmedPlayers.length,
          maxPlayers: poll.openPlayEvent.maxPlayers,
          pollId: poll._id,
          hasVoted: false
        };
      } else if (poll.status === 'active' && daysDiff <= 1 && daysDiff >= 0 && userVote === 'Yes') {
        // Event reminder for confirmed players
        notification = {
          id: poll._id + '_reminder',
          type: 'open_play_reminder',
          title: 'Open Play Tomorrow!',
          message: `Don't forget about ${poll.title}`,
          eventDate,
          startTime: poll.openPlayEvent.startTime,
          endTime: poll.openPlayEvent.endTime,
          confirmedPlayers: poll.openPlayEvent.confirmedPlayers.length,
          maxPlayers: poll.openPlayEvent.maxPlayers,
          pollId: poll._id,
          hasVoted: true,
          userVote
        };
      } else if (poll.status === 'closed' && poll.openPlayEvent.matchesGenerated && userVote === 'Yes') {
        // Matches are ready
        notification = {
          id: poll._id + '_matches',
          type: 'matches_ready',
          title: 'Matches Ready!',
          message: `Court assignments for ${poll.title} are available`,
          eventDate,
          startTime: poll.openPlayEvent.startTime,
          endTime: poll.openPlayEvent.endTime,
          confirmedPlayers: poll.openPlayEvent.confirmedPlayers.length,
          maxPlayers: poll.openPlayEvent.maxPlayers,
          pollId: poll._id,
          hasVoted: true,
          userVote
        };
      }

      if (notification) {
        notifications.push(notification);
      }
    });

    return notifications;
  }

  private clearNotifications(): void {
    this.notificationSubject.next({
      overdueCount: 0,
      dueSoonCount: 0,
      dueTodayCount: 0,
      openPlayCount: 0,
      totalCount: 0,
      notifications: []
    });
  }

  // Get current notification count for badges
  getNotificationCount(): number {
    return this.notificationSubject.value.totalCount;
  }

  // Get overdue count specifically
  getOverdueCount(): number {
    return this.notificationSubject.value.overdueCount;
  }

  // Get all notifications
  getAllNotifications(): AppNotification[] {
    return this.notificationSubject.value.notifications;
  }

  // Get urgent notifications (overdue + due today + new open play)
  getUrgentNotifications(): AppNotification[] {
    return this.notificationSubject.value.notifications.filter(n => 
      'amount' in n ? (n.type === 'overdue' || n.type === 'due_today') : 
      (n.type === 'open_play_new' || n.type === 'matches_ready')
    );
  }

  // Get urgent payment notifications only
  getUrgentPaymentNotifications(): PaymentNotification[] {
    return this.notificationSubject.value.notifications.filter(n => 
      'amount' in n && (n.type === 'overdue' || n.type === 'due_today')
    ) as PaymentNotification[];
  }

  // Get Open Play notifications only
  getOpenPlayNotifications(): OpenPlayNotification[] {
    return this.notificationSubject.value.notifications.filter(n => 
      'pollId' in n
    ) as OpenPlayNotification[];
  }

  // Get payment notifications only
  getPaymentNotifications(): PaymentNotification[] {
    return this.notificationSubject.value.notifications.filter(n => 
      'amount' in n
    ) as PaymentNotification[];
  }

  // Get Open Play count
  getOpenPlayCount(): number {
    return this.notificationSubject.value.openPlayCount;
  }

  // Mark notification as viewed/dismissed (optional for future use)
  dismissNotification(notificationId: string): void {
    // For now, just remove from current notifications
    // In the future, could store dismissed state in localStorage or backend
    const current = this.notificationSubject.value;
    const updatedNotifications = current.notifications.filter(n => n.id !== notificationId);
    
    this.notificationSubject.next({
      ...current,
      notifications: updatedNotifications,
      totalCount: updatedNotifications.length,
      overdueCount: updatedNotifications.filter(n => n.type === 'overdue').length,
      dueTodayCount: updatedNotifications.filter(n => n.type === 'due_today').length,
      dueSoonCount: updatedNotifications.filter(n => n.type === 'due_soon').length,
    });
  }

  // Refresh notifications (call this when payments are updated)
  refreshNotifications(): void {
    this.loadNotifications();
  }
}