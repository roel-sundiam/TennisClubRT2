import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, map, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { WebSocketService } from './websocket.service';

// Chat interfaces
export interface ChatRoom {
  _id: string;
  name: string;
  description?: string;
  type: 'general' | 'admin' | 'announcement';
  isActive: boolean;
  participantRoles?: ('member' | 'admin' | 'superadmin')[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage?: ChatMessage;
  participantCount: number;
  isParticipant: boolean;
}

export interface ChatMessage {
  _id: string;
  roomId: string;
  userId: string;
  user?: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    role: string;
  };
  content: string;
  type: 'text' | 'system' | 'announcement';
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  replyTo?: string;
  metadata?: {
    systemType?: string;
    mentions?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  _id: string;
  roomId: string;
  userId: string;
  user?: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    role: string;
    isActive: boolean;
  };
  joinedAt: string;
  lastReadAt?: string;
  isActive: boolean;
  notifications: boolean;
  role?: 'member' | 'moderator' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'announcement';
  replyTo?: string;
}

export interface CreateChatRoomRequest {
  name: string;
  description?: string;
  type: 'general' | 'admin' | 'announcement';
  participantRoles?: ('member' | 'admin' | 'superadmin')[];
}

export interface ChatMessageEvent {
  type: 'new_message' | 'message_edited' | 'message_deleted';
  data: ChatMessage;
  timestamp: string;
  message: string;
}

export interface ChatTypingEvent {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface ChatUserStatusEvent {
  type: 'user_joined' | 'user_left' | 'user_online' | 'user_offline';
  data: {
    roomId?: string;
    userId: string;
    username: string;
    fullName: string;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  private destroy$ = new Subject<void>();

  // State management
  private roomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private currentRoomSubject = new BehaviorSubject<string | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private typingUsersSubject = new BehaviorSubject<Map<string, ChatTypingEvent>>(new Map());
  private onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  private unreadCountSubject = new BehaviorSubject<number>(0);

  // Chat events
  private messageReceivedSubject = new Subject<ChatMessage>();
  private typingIndicatorSubject = new Subject<ChatTypingEvent>();
  private userStatusChangeSubject = new Subject<ChatUserStatusEvent>();

  // Observables
  public rooms$ = this.roomsSubject.asObservable();
  public currentRoom$ = this.currentRoomSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public typingUsers$ = this.typingUsersSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public typingIndicator$ = this.typingIndicatorSubject.asObservable();
  public userStatusChange$ = this.userStatusChangeSubject.asObservable();

  // Chat state
  private isAuthenticated = false;
  private currentUser: any = null;
  private typingTimeout: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    console.log('💬 ChatService initialized');
    
    // Initialize chat when user is authenticated
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user && !this.isAuthenticated) {
        console.log('💬 User authenticated, initializing chat');
        this.currentUser = user;
        this.isAuthenticated = true;
        this.initializeChat();
      } else if (!user && this.isAuthenticated) {
        console.log('💬 User logged out, cleaning up chat');
        this.cleanup();
      }
    });

    // Setup WebSocket listeners
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }

  /**
   * Initialize chat functionality
   */
  private initializeChat(): void {
    if (!this.currentUser) return;

    console.log('💬 Initializing chat');
    
    // Authenticate with chat WebSocket
    this.authenticateChat();
    
    // Load initial chat rooms
    this.loadChatRooms();
  }

  /**
   * Authenticate with chat WebSocket
   */
  private authenticateChat(): void {
    if (!this.currentUser) return;

    // Wait for WebSocket connection before authenticating
    this.webSocketService.isConnected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(connected => {
      if (connected && this.currentUser && this.webSocketService.socket) {
        console.log('💬 Authenticating chat with WebSocket');
        this.webSocketService.socket.emit('chat_authenticate', {
          userId: this.currentUser._id,
          username: this.currentUser.username,
          fullName: this.currentUser.fullName
        });
      }
    });
  }

  /**
   * Setup WebSocket event listeners for chat
   */
  private setupWebSocketListeners(): void {
    // Wait for WebSocket connection before setting up listeners
    this.webSocketService.isConnected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(connected => {
      if (connected && this.webSocketService.socket) {
        console.log('💬 Setting up WebSocket chat listeners');
        this.setupChatEventListeners();
      }
    });
  }

  /**
   * Setup chat-specific event listeners on the socket
   */
  private setupChatEventListeners(): void {
    const socket = this.webSocketService.socket;
    if (!socket) {
      console.warn('💬 No socket available for chat listeners');
      return;
    }

    // Remove existing listeners to avoid duplicates
    socket.off('chat_message');
    socket.off('user_typing');
    socket.off('user_status_changed');
    socket.off('chat_authenticated');
    socket.off('chat_announcement');

    // Chat message events
    socket.on('chat_message', (event: ChatMessageEvent) => {
      console.log('💬 Received chat message event:', event);
      this.handleIncomingMessage(event.data);
    });

    // Typing indicator events
    socket.on('user_typing', (event: ChatTypingEvent) => {
      console.log('💬 Received typing indicator:', event);
      this.handleTypingIndicator(event);
    });

    // User status events
    socket.on('user_status_changed', (event: ChatUserStatusEvent) => {
      console.log('💬 Received user status change:', event);
      this.handleUserStatusChange(event);
    });

    // Chat authentication confirmation
    socket.on('chat_authenticated', (data: { success: boolean }) => {
      console.log('💬 Chat authentication confirmed:', data);
    });

    // Chat announcement events
    socket.on('chat_announcement', (data: any) => {
      console.log('💬 Received chat announcement:', data);
      // Handle announcement notifications
    });

    console.log('💬 Chat WebSocket listeners set up successfully');
  }

  /**
   * Handle incoming chat message
   */
  private handleIncomingMessage(message: ChatMessage): void {
    console.log('💬 Received message:', message.user?.fullName, message.content);

    const currentMessages = this.messagesSubject.value;
    const currentRoom = this.currentRoomSubject.value;

    // If message is for current room, add to messages
    if (message.roomId === currentRoom) {
      // Check if message already exists (avoid duplicates)
      const existingIndex = currentMessages.findIndex(m => m._id === message._id);
      if (existingIndex === -1) {
        const updatedMessages = [...currentMessages, message];
        this.messagesSubject.next(updatedMessages);
      }
    }

    // Only update unread count for messages from other users
    if (message.userId !== this.currentUser?._id) {
      this.updateUnreadCount(message.roomId);
    }

    // Emit message received event
    this.messageReceivedSubject.next(message);
  }

  /**
   * Handle typing indicator
   */
  private handleTypingIndicator(event: ChatTypingEvent): void {
    const typingUsers = new Map(this.typingUsersSubject.value);
    const key = `${event.roomId}_${event.userId}`;

    if (event.isTyping) {
      typingUsers.set(key, event);
    } else {
      typingUsers.delete(key);
    }

    this.typingUsersSubject.next(typingUsers);
    this.typingIndicatorSubject.next(event);
  }

  /**
   * Handle user status change
   */
  private handleUserStatusChange(event: ChatUserStatusEvent): void {
    const onlineUsers = new Set(this.onlineUsersSubject.value);

    if (event.type === 'user_online') {
      onlineUsers.add(event.data.userId);
    } else if (event.type === 'user_offline') {
      onlineUsers.delete(event.data.userId);
    }

    this.onlineUsersSubject.next(onlineUsers);
    this.userStatusChangeSubject.next(event);
  }

  /**
   * Update unread count for a room
   */
  private updateUnreadCount(roomId: string): void {
    const rooms = this.roomsSubject.value;
    const updatedRooms = rooms.map(room => {
      if (room._id === roomId) {
        return { ...room, unreadCount: room.unreadCount + 1 };
      }
      return room;
    });
    this.roomsSubject.next(updatedRooms);
    
    // Update total unread count
    const totalUnread = updatedRooms.reduce((sum, room) => sum + room.unreadCount, 0);
    this.unreadCountSubject.next(totalUnread);
  }

  /**
   * Load chat rooms
   */
  loadChatRooms(): Observable<ChatRoom[]> {
    return this.http.get<{ success: boolean; data: ChatRoom[] }>(`${this.apiUrl}`)
      .pipe(
        map(response => {
          if (response.success) {
            this.roomsSubject.next(response.data);
            
            // Calculate total unread count
            const totalUnread = response.data.reduce((sum, room) => sum + room.unreadCount, 0);
            this.unreadCountSubject.next(totalUnread);
            
            // Auto-join rooms that user is not yet a participant of
            response.data.forEach(room => {
              if (!room.isParticipant) {
                console.log('💬 Auto-joining room:', room.name);
                this.joinRoom(room._id).subscribe({
                  next: () => {
                    console.log('💬 Successfully auto-joined room:', room.name);
                    // Update room status
                    room.isParticipant = true;
                  },
                  error: (error) => {
                    console.error('💬 Failed to auto-join room:', room.name, error);
                  }
                });
              }
            });
            
            return response.data;
          }
          return [];
        })
      );
  }

  /**
   * Get messages for a room
   */
  getRoomMessages(roomId: string, limit: number = 50, before?: string): Observable<ChatMessage[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (before) {
      params = params.set('before', before);
    }

    return this.http.get<{ success: boolean; data: ChatMessage[] }>(`${this.apiUrl}/${roomId}/messages`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          return [];
        })
      );
  }

  /**
   * Send message to room
   */
  sendMessage(roomId: string, request: SendMessageRequest): Observable<ChatMessage> {
    const currentRoom = this.currentRoomSubject.value;
    
    // Create optimistic message for immediate UI update
    if (roomId === currentRoom && this.currentUser) {
      const optimisticMessage: ChatMessage = {
        _id: 'temp-' + Date.now(),
        roomId: roomId,
        userId: this.currentUser._id,
        user: {
          _id: this.currentUser._id,
          username: this.currentUser.username,
          fullName: this.currentUser.fullName,
          profilePicture: this.currentUser.profilePicture,
          role: this.currentUser.role
        },
        content: request.content,
        type: request.type || 'text',
        isEdited: false,
        isDeleted: false,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add optimistic message immediately
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, optimisticMessage]);
    }
    
    return this.http.post<{ success: boolean; data: ChatMessage }>(`${this.apiUrl}/${roomId}/messages`, request)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to send message');
          }
          
          // Replace optimistic message with real message from server
          if (response.data.roomId === currentRoom) {
            const currentMessages = this.messagesSubject.value;
            
            // Remove optimistic message and add real message
            const filteredMessages = currentMessages.filter(m => !m._id.startsWith('temp-'));
            const existingIndex = filteredMessages.findIndex(m => m._id === response.data._id);
            
            if (existingIndex === -1) {
              this.messagesSubject.next([...filteredMessages, response.data]);
            }
            
            // Mark room as read since user is actively in this room and just sent a message
            this.markAsRead(currentRoom).subscribe({
              error: (error) => console.warn('Failed to mark room as read:', error)
            });
          }
          
          return response.data;
        })
      );
  }

  /**
   * Join a chat room
   */
  joinRoom(roomId: string): Observable<any> {
    // Join via API
    const apiJoin = this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/${roomId}/join`, {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to join room');
          }
          return response.data;
        })
      );

    // Join via WebSocket
    if (this.webSocketService.socket) {
      this.webSocketService.socket.emit('join_chat_room', roomId);
    }

    return apiJoin;
  }

  /**
   * Leave a chat room
   */
  leaveRoom(roomId: string): Observable<any> {
    // Leave via API
    const apiLeave = this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/${roomId}/leave`, {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to leave room');
          }
          return response.data;
        })
      );

    // Leave via WebSocket
    if (this.webSocketService.socket) {
      this.webSocketService.socket.emit('leave_chat_room', roomId);
    }

    return apiLeave;
  }

  /**
   * Set current active room
   */
  setCurrentRoom(roomId: string | null): void {
    const previousRoom = this.currentRoomSubject.value;
    
    // Leave previous room
    if (previousRoom && this.webSocketService.socket) {
      this.webSocketService.socket.emit('leave_chat_room', previousRoom);
    }

    // Set new room
    this.currentRoomSubject.next(roomId);
    this.messagesSubject.next([]); // Clear messages

    // Join new room
    if (roomId) {
      if (this.webSocketService.socket) {
        this.webSocketService.socket.emit('join_chat_room', roomId);
      }

      // Ensure user is joined to the room via API first
      this.joinRoom(roomId).subscribe({
        next: () => {
          console.log('💬 Successfully joined room:', roomId);
          
          // Load messages for new room
          this.getRoomMessages(roomId).subscribe({
            next: (messages) => {
              this.messagesSubject.next(messages);
            },
            error: (error) => {
              console.error('💬 Error loading messages:', error);
            }
          });

          // Mark as read
          this.markAsRead(roomId).subscribe();
        },
        error: (error) => {
          console.error('💬 Error joining room:', error);
          // Try to load messages anyway in case user is already a participant
          this.getRoomMessages(roomId).subscribe({
            next: (messages) => {
              this.messagesSubject.next(messages);
            },
            error: (msgError) => {
              console.error('💬 Error loading messages after join failed:', msgError);
            }
          });
        }
      });
    }
  }

  /**
   * Mark room as read
   */
  markAsRead(roomId: string): Observable<any> {
    return this.http.patch<{ success: boolean; data: any }>(`${this.apiUrl}/${roomId}/participant`, {
      lastReadAt: new Date().toISOString()
    }).pipe(
      map(response => {
        if (response.success) {
          // Update local unread count
          const rooms = this.roomsSubject.value;
          const updatedRooms = rooms.map(room => {
            if (room._id === roomId) {
              return { ...room, unreadCount: 0 };
            }
            return room;
          });
          this.roomsSubject.next(updatedRooms);
          
          // Update total unread count
          const totalUnread = updatedRooms.reduce((sum, room) => sum + room.unreadCount, 0);
          this.unreadCountSubject.next(totalUnread);
        }
        return response.data;
      })
    );
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(roomId: string, isTyping: boolean): void {
    if (!this.webSocketService.socket) return;

    if (isTyping) {
      this.webSocketService.socket.emit('chat_typing_start', { roomId });
      
      // Clear existing timeout and set new one
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      
      this.typingTimeout = setTimeout(() => {
        this.webSocketService.socket?.emit('chat_typing_stop', { roomId });
      }, 3000); // Stop typing after 3 seconds of inactivity
    } else {
      this.webSocketService.socket.emit('chat_typing_stop', { roomId });
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
    }
  }

  /**
   * Create new chat room (admin only)
   */
  createChatRoom(request: CreateChatRoomRequest): Observable<ChatRoom> {
    return this.http.post<{ success: boolean; data: ChatRoom }>(`${this.apiUrl}`, request)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to create chat room');
          }
          
          // Refresh rooms list
          this.loadChatRooms().subscribe();
          
          return response.data;
        })
      );
  }

  /**
   * Get room participants
   */
  getRoomParticipants(roomId: string): Observable<ChatParticipant[]> {
    return this.http.get<{ success: boolean; data: ChatParticipant[] }>(`${this.apiUrl}/${roomId}/participants`)
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          return [];
        })
      );
  }

  /**
   * Cleanup chat state
   */
  private cleanup(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.roomsSubject.next([]);
    this.currentRoomSubject.next(null);
    this.messagesSubject.next([]);
    this.typingUsersSubject.next(new Map());
    this.onlineUsersSubject.next(new Set());
    this.unreadCountSubject.next(0);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  /**
   * Get current room ID
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomSubject.value;
  }

  /**
   * Get current messages
   */
  getCurrentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsersSubject.value.has(userId);
  }

  /**
   * Get typing users for current room
   */
  getTypingUsersForRoom(roomId: string): ChatTypingEvent[] {
    const typingUsers = this.typingUsersSubject.value;
    const result: ChatTypingEvent[] = [];
    
    typingUsers.forEach((event, key) => {
      if (event.roomId === roomId && event.isTyping) {
        result.push(event);
      }
    });
    
    return result;
  }


}