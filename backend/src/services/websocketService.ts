import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface FinancialUpdateEvent {
  type: 'financial_data_updated';
  data: any;
  timestamp: string;
  message: string;
}

export interface CourtUsageUpdateEvent {
  type: 'court_usage_data_updated';
  data: any;
  timestamp: string;
  message: string;
}

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

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Set<Socket> = new Set();

  constructor() {
    console.log('🔌 WebSocket Service initialized');
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ["http://localhost:4200", "http://localhost:4201"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('🔗 Client connected to WebSocket:', socket.id);
      this.connectedClients.add(socket);

      // Handle client subscription to financial updates
      socket.on('subscribe_financial_updates', () => {
        console.log('📊 Client subscribed to financial updates:', socket.id);
        socket.join('financial_updates');
        socket.emit('subscription_confirmed', { type: 'financial_updates' });
      });

      // Handle client unsubscription
      socket.on('unsubscribe_financial_updates', () => {
        console.log('📊 Client unsubscribed from financial updates:', socket.id);
        socket.leave('financial_updates');
      });

      // Handle client subscription to court usage updates
      socket.on('subscribe_court_usage_updates', () => {
        console.log('🏸 Client subscribed to court usage updates:', socket.id);
        socket.join('court_usage_updates');
        socket.emit('subscription_confirmed', { type: 'court_usage_updates' });
      });

      // Handle client unsubscription from court usage
      socket.on('unsubscribe_court_usage_updates', () => {
        console.log('🏸 Client unsubscribed from court usage updates:', socket.id);
        socket.leave('court_usage_updates');
      });

      // Handle client subscription to open play notifications
      socket.on('subscribe_open_play_notifications', () => {
        console.log('🎾 Client subscribed to open play notifications:', socket.id);
        socket.join('open_play_notifications');
        socket.emit('subscription_confirmed', { type: 'open_play_notifications' });
      });

      // Handle client unsubscription from open play notifications
      socket.on('unsubscribe_open_play_notifications', () => {
        console.log('🎾 Client unsubscribed from open play notifications:', socket.id);
        socket.leave('open_play_notifications');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        this.connectedClients.delete(socket);
      });

      // Send welcome message
      socket.emit('welcome', {
        message: 'Connected to Tennis Club RT2 real-time updates',
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Socket.IO server initialized with CORS for Angular dev server');
  }

  /**
   * Emit financial data update to all subscribed clients
   */
  emitFinancialUpdate(updateData: FinancialUpdateEvent): void {
    if (!this.io) {
      console.warn('⚠️  WebSocket not initialized - cannot emit financial update');
      return;
    }

    console.log('📡 Broadcasting financial update to subscribed clients');
    console.log(`💰 Fund Balance Updated: ₱${updateData.data.fundBalance?.toLocaleString()}`);
    
    // Emit to all clients subscribed to financial updates
    this.io.to('financial_updates').emit('financial_update', updateData);

    // Also emit to all connected clients as a fallback
    this.io.emit('financial_data_changed', {
      message: updateData.message,
      timestamp: updateData.timestamp
    });
  }

  /**
   * Emit general broadcast message
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️  WebSocket not initialized - cannot broadcast');
      return;
    }

    console.log(`📡 Broadcasting ${event} to all clients`);
    this.io.emit(event, data);
  }

  /**
   * Get connection statistics
   */
  getStats(): { connectedClients: number; rooms: string[] } {
    if (!this.io) {
      return { connectedClients: 0, rooms: [] };
    }

    const rooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => !this.io!.sockets.sockets.has(room)); // Filter out socket IDs

    return {
      connectedClients: this.connectedClients.size,
      rooms
    };
  }

  /**
   * Emit court usage data update to all subscribed clients
   */
  emitCourtUsageUpdate(updateData: CourtUsageUpdateEvent): void {
    if (!this.io) {
      console.warn('⚠️  WebSocket not initialized - cannot emit court usage update');
      return;
    }

    console.log('📡 Broadcasting court usage update to subscribed clients');
    console.log(`🏸 Court Usage Updated: ${updateData.data.summary?.totalMembers} members, ${updateData.data.summary?.totalRevenue} revenue`);
    
    // Emit to all clients subscribed to court usage updates
    this.io.to('court_usage_updates').emit('court_usage_update', updateData);

    // Also emit to all connected clients as a fallback
    this.io.emit('court_usage_data_changed', {
      message: updateData.message,
      timestamp: updateData.timestamp
    });
  }

  /**
   * Emit open play notification to all subscribed clients
   */
  emitOpenPlayNotification(notificationData: OpenPlayNotificationEvent): void {
    if (!this.io) {
      console.warn('⚠️  WebSocket not initialized - cannot emit open play notification');
      return;
    }

    console.log('📡 Broadcasting open play notification to subscribed clients');
    console.log(`🎾 Open Play Event: ${notificationData.data.title} on ${new Date(notificationData.data.eventDate).toLocaleDateString()}`);
    console.log(`🎾 Event times: ${notificationData.data.startTime}:00 - ${notificationData.data.endTime}:00`);
    console.log('🎾 Full notification data:', JSON.stringify(notificationData, null, 2));
    
    // Emit to all clients subscribed to open play notifications
    this.io.to('open_play_notifications').emit('open_play_notification', notificationData);

    // Also emit to all connected clients as a general notification
    this.io.emit('open_play_event', {
      message: notificationData.message,
      timestamp: notificationData.timestamp,
      pollId: notificationData.data.pollId,
      eventDate: notificationData.data.eventDate,
      title: notificationData.data.title,
      startTime: notificationData.data.startTime,
      endTime: notificationData.data.endTime
    });
  }

  /**
   * Check if WebSocket service is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();