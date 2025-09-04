import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface OpenPlayNotificationEvent {
  type: 'open_play_created' | 'open_play_updated' | 'open_play_closed';
  data: {
    pollId: string;
    title: string;
    description: string;
    eventDate: string;
    startTime: number;
    endTime: number;
    maxPlayers: number;
    confirmedPlayers: number;
    createdBy: {
      _id: string;
      username: string;
      fullName: string;
    };
  };
  timestamp: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private serverUrl = environment.socketUrl;
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private openPlayNotificationSubject = new Subject<OpenPlayNotificationEvent>();

  public isConnected$ = this.connectionSubject.asObservable();
  public openPlayNotifications$ = this.openPlayNotificationSubject.asObservable();

  constructor(private authService: AuthService) {
    console.log('🔌 WebSocketService constructor called');
    // Initialize connection when user is authenticated
    this.authService.currentUser$.subscribe(user => {
      console.log('🔌 WebSocketService: User auth state changed:', !!user);
      if (user) {
        console.log('🔌 WebSocketService: User authenticated, connecting...');
        this.connect();
      } else {
        console.log('🔌 WebSocketService: User not authenticated, disconnecting...');
        this.disconnect();
      }
    });
  }

  /**
   * Establish WebSocket connection
   */
  private connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Already connected to WebSocket');
      return;
    }

    console.log('🔌 Connecting to WebSocket server at:', this.serverUrl);
    
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server:', this.socket?.id);
      this.connectionSubject.next(true);
      this.subscribeToOpenPlayNotifications();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      this.connectionSubject.next(false);
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Reconnected to WebSocket server');
      this.connectionSubject.next(true);
      this.subscribeToOpenPlayNotifications();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 WebSocket connection error:', error);
      this.connectionSubject.next(false);
    });

    // Listen for open play notifications
    this.socket.on('open_play_notification', (data: OpenPlayNotificationEvent) => {
      console.log('🎾 Received open play notification:', data);
      console.log('🎾 Notification startTime:', data.data.startTime, 'endTime:', data.data.endTime);
      this.openPlayNotificationSubject.next(data);
    });

    // Listen for general open play events
    this.socket.on('open_play_event', (data: any) => {
      console.log('🎾 Received open play event (fallback):', data);
      console.log('🎾 Fallback event startTime:', data.startTime, 'endTime:', data.endTime);
      // Convert to notification format for consistency
      const notification: OpenPlayNotificationEvent = {
        type: 'open_play_created',
        data: {
          pollId: data.pollId,
          title: data.title,
          description: '',
          eventDate: data.eventDate,
          startTime: data.startTime || 0,
          endTime: data.endTime || 0,
          maxPlayers: 12,
          confirmedPlayers: 0,
          createdBy: {
            _id: '',
            username: 'System',
            fullName: 'System'
          }
        },
        timestamp: data.timestamp,
        message: data.message
      };
      this.openPlayNotificationSubject.next(notification);
    });

    this.socket.on('welcome', (data) => {
      console.log('👋 WebSocket welcome message:', data);
    });

    this.socket.on('subscription_confirmed', (data) => {
      console.log('✅ WebSocket subscription confirmed:', data);
    });
  }

  /**
   * Subscribe to open play notifications
   */
  private subscribeToOpenPlayNotifications(): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Cannot subscribe - not connected to WebSocket');
      return;
    }

    console.log('📡 Subscribing to open play notifications...');
    this.socket.emit('subscribe_open_play_notifications');
  }

  /**
   * Unsubscribe from open play notifications
   */
  private unsubscribeFromOpenPlayNotifications(): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('📡 Unsubscribing from open play notifications...');
    this.socket.emit('unsubscribe_open_play_notifications');
  }

  /**
   * Disconnect from WebSocket
   */
  private disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from WebSocket...');
      this.unsubscribeFromOpenPlayNotifications();
      this.socket.disconnect();
      this.socket = null;
      this.connectionSubject.next(false);
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    console.log('🔄 Force reconnecting WebSocket...');
    this.disconnect();
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.connect();
      }
    }, 1000);
  }

  /**
   * Subscribe to financial updates (existing functionality)
   */
  subscribeToFinancialUpdates(): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_financial_updates');
    }
  }

  /**
   * Subscribe to court usage updates (existing functionality)
   */
  subscribeToCourtUsageUpdates(): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_court_usage_updates');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}