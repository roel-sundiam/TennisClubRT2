import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService, ChatRoom, ChatMessage, ChatTypingEvent } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <div class="chat-container" [class.minimized]="isMinimized" [class.closed]="isClosed">
      <!-- Chat Toggle Button (when minimized or closed) -->
      <div 
        class="chat-toggle-button" 
        *ngIf="isMinimized || isClosed"
        (click)="isClosed ? toggleChat() : restore()"
        (touchstart)="onToggleButtonTouchStart($event)"
        (touchend)="onToggleButtonTouchEnd($event)"
        [matBadge]="totalUnreadCount"
        [matBadgeHidden]="totalUnreadCount === 0"
        matBadgeColor="warn"
        matBadgeSize="small"
        [matTooltip]="'Chat (' + totalUnreadCount + ' unread)'"
      >
        <mat-icon>chat</mat-icon>
      </div>

      <!-- Chat Window -->
      <mat-card class="chat-window" *ngIf="!isClosed && !isMinimized">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-title">
            <mat-icon class="chat-icon">chat</mat-icon>
            <span class="title-text">Club Chat</span>
            <span 
              class="unread-badge" 
              *ngIf="totalUnreadCount > 0"
              [matBadge]="totalUnreadCount"
              matBadgeColor="warn"
              matBadgeSize="small"
            ></span>
          </div>
          <div class="header-actions">
            <button class="test-sound-btn" (click)="testSound()" title="Test Sound" *ngIf="!isAudioInitialized">
              <mat-icon>volume_up</mat-icon>
            </button>
            <button class="minimize-btn" (click)="minimize()" title="Minimize">
              <mat-icon>remove</mat-icon>
            </button>
          </div>
        </div>

        <!-- Simplified Chat Content (no tabs for now, just General Chat) -->
        <div class="chat-content" *ngIf="chatRooms.length > 0">
          <!-- Room Title -->
          <div class="room-header">
            <span class="room-title">General Chat</span>
            <span 
              class="unread-count" 
              *ngIf="getGeneralChatUnreadCount() > 0"
              [matBadge]="getGeneralChatUnreadCount()"
              matBadgeColor="warn"
              matBadgeSize="small"
            ></span>
          </div>

          <!-- Messages Area -->
          <div class="messages-container" #messagesContainer>
            <div class="messages-list">
              <div 
                *ngFor="let message of messages; trackBy: trackByMessageId" 
                class="message-item"
                [class.own-message]="message.userId === currentUser?._id"
                [class.system-message]="message.type === 'system'"
                [class.announcement-message]="message.type === 'announcement'"
              >
                <!-- Skip System Messages -->
                <div *ngIf="message.type === 'text'" class="message-content">
                  <div class="message-header">
                    <span class="sender-name">{{ message.user?.fullName || 'Unknown' }}</span>
                    <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                  </div>
                  <div class="message-text">{{ message.content }}</div>
                  <div *ngIf="message.isEdited" class="edited-indicator">
                    <mat-icon class="edited-icon">edit</mat-icon>
                    <span>Edited</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing Indicators -->
            <div class="typing-indicators" *ngIf="typingUsers.length > 0">
              <div class="typing-item">
                <mat-icon class="typing-icon">more_horiz</mat-icon>
                <span>{{ getTypingText() }}</span>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-container">
            <div class="custom-input-wrapper">
              <input 
                class="custom-message-input"
                [(ngModel)]="messageText"
                (keydown.enter)="sendMessage()"
                (input)="onTyping()"
                (blur)="stopTyping()"
                placeholder="Type a message..."
                [disabled]="!currentRoom"
                #messageInput
                autocomplete="off"
                spellcheck="false"
              >
            </div>
            <button 
              mat-icon-button 
              (click)="sendMessage()"
              [disabled]="!messageText.trim() || !currentRoom"
              color="primary"
              matTooltip="Send"
            >
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="chatRooms.length === 0">
          <mat-icon>chat</mat-icon>
          <p>Loading chat rooms...</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .chat-toggle-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0084ff, #00c6ff);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 132, 255, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: rgba(0, 132, 255, 0.3);
      user-select: none;
      -webkit-user-select: none;
    }

    .chat-toggle-button:hover {
      background: linear-gradient(135deg, #0066cc, #0099e6);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 132, 255, 0.5);
    }

    .chat-toggle-button:active {
      transform: translateY(0px) scale(0.95);
      box-shadow: 0 2px 10px rgba(0, 132, 255, 0.4);
    }

    .chat-window {
      width: 328px;
      height: 420px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .chat-header {
      background: linear-gradient(135deg, #0084ff, #00c6ff);
      color: white;
      padding: 5px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 25px;
      backdrop-filter: blur(10px);
      flex-shrink: 0;
      border-radius: 16px 16px 0 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: white;
    }

    .title-text {
      font-size: 12px;
      font-weight: 600;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .header-actions {
      display: flex;
      gap: 2px;
    }

    .minimize-btn,
    .test-sound-btn {
      background: transparent;
      border: none;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .minimize-btn:hover,
    .test-sound-btn:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .test-sound-btn {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .test-sound-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .minimize-btn mat-icon,
    .test-sound-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: white;
    }

    .unread-badge {
      position: relative;
      margin-left: 6px;
    }

    .room-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background-color: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
      min-height: 32px;
    }

    .room-title {
      font-weight: 500;
      font-size: 11px;
      color: #65676b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .unread-count {
      position: relative;
      margin-left: 6px;
    }

    .chat-content {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      flex: 1;
      min-height: 0;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      min-height: 0;
      background-color: #ffffff;
      scroll-behavior: smooth;
    }

    .messages-container::-webkit-scrollbar {
      width: 4px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-item {
      display: flex;
      flex-direction: column;
      animation: message-appear 0.3s ease-out;
    }

    @keyframes message-appear {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-item.own-message {
      align-items: flex-end;
    }

    .message-item.own-message .message-content {
      background: linear-gradient(135deg, #0084ff, #00c6ff);
      color: white;
      border-radius: 18px 18px 4px 18px;
    }

    .message-content {
      max-width: 85%;
      padding: 8px 12px;
      background-color: #f0f2f5;
      border-radius: 18px 18px 18px 4px;
      word-wrap: break-word;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .sender-name {
      font-weight: 600;
      font-size: 11px;
      opacity: 0.9;
      color: #050505;
    }

    .message-item.own-message .sender-name {
      color: rgba(255, 255, 255, 0.9);
    }

    .message-time {
      font-size: 10px;
      opacity: 0.7;
      color: #65676b;
    }

    .message-item.own-message .message-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .announcement-icon {
      font-size: 14px;
      color: #ff9800;
    }

    .message-text {
      line-height: 1.3;
      font-size: 14px;
      color: #050505;
    }

    .message-item.own-message .message-text {
      color: white;
    }

    .edited-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      opacity: 0.6;
      margin-top: 4px;
    }

    .edited-icon {
      font-size: 12px;
    }

    .system-message {
      align-items: center;
    }

    .system-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: #e3f2fd;
      border-radius: 20px;
      font-size: 14px;
      color: #1976d2;
    }

    .system-icon {
      font-size: 16px;
    }

    .announcement-message .message-content {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
    }

    .announcement-message.own-message .message-content {
      background-color: #ff9800;
      color: white;
    }

    .typing-indicators {
      margin-top: 4px;
      padding: 4px 0;
    }

    .typing-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #65676b;
      font-style: italic;
      font-weight: 400;
    }

    .typing-icon {
      animation: typing-dots 1.4s infinite;
      font-size: 14px;
      color: #0084ff;
    }

    @keyframes typing-dots {
      0%, 60%, 100% { 
        opacity: 0.4;
        transform: scale(0.8);
      }
      30% { 
        opacity: 1;
        transform: scale(1);
      }
    }

    .message-input-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      background-color: #ffffff;
      flex-shrink: 0;
      min-height: 48px;
      position: sticky;
      bottom: 0;
      z-index: 10;
    }

    .custom-input-wrapper {
      flex: 1;
      min-width: 0;
      position: relative;
    }

    .custom-message-input {
      width: 100%;
      min-height: 36px;
      padding: 8px 14px;
      background-color: #f0f2f5;
      border: 1px solid transparent;
      border-radius: 20px;
      font-size: 12px;
      color: #050505;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      outline: none;
      resize: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .custom-message-input:focus {
      background-color: #ffffff;
      border-color: #0084ff;
      box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
    }

    .custom-message-input::placeholder {
      color: #8a8d91;
      font-size: 12px;
      opacity: 0.8;
    }

    .custom-message-input:disabled {
      background-color: #e4e6ea;
      color: #bcc0c4;
      cursor: not-allowed;
    }

    .message-input-container button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0084ff, #00c6ff);
      color: white;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .message-input-container button:disabled {
      background: #e4e6ea;
      color: #bcc0c4;
    }

    .message-input-container button:not(:disabled):hover {
      background: linear-gradient(135deg, #0066cc, #0099e6);
      transform: scale(1.05);
    }

    .message-input-container button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #65676b;
    }

    .loading-state mat-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.4;
      color: #0084ff;
      animation: pulse 2s infinite;
    }

    .loading-state p {
      font-size: 14px;
      font-weight: 400;
      margin: 0;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.7; }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .chat-container:not(.minimized):not(.closed) {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      .chat-container.minimized,
      .chat-container.closed {
        position: fixed;
        bottom: 20px;
        right: 20px;
        top: auto;
        left: auto;
        width: auto;
        height: auto;
        z-index: 1000;
      }

      .chat-window {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
        box-shadow: none;
      }

      .chat-toggle-button {
        width: 56px;
        height: 56px;
        position: relative;
        bottom: auto;
        right: auto;
        z-index: 1001;
      }

      .chat-header {
        padding: 8px 12px;
        min-height: 40px;
        border-radius: 0;
      }

      .title-text {
        font-size: 16px;
      }

      .chat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .minimize-btn {
        width: 32px;
        height: 32px;
      }

      .minimize-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .room-header {
        padding: 4px 10px;
        min-height: 28px;
      }

      .room-title {
        font-size: 10px;
      }

      .messages-container {
        padding: 8px;
      }

      .message-content {
        max-width: 90%;
        font-size: 13px;
        padding: 6px 10px;
      }

      .sender-name {
        font-size: 10px;
      }

      .message-time {
        font-size: 9px;
      }

      .message-input-container {
        padding: 6px 10px;
        min-height: 42px;
      }

      .custom-message-input {
        font-size: 13px;
        min-height: 36px;
        padding: 8px 14px;
      }

      .custom-message-input::placeholder {
        font-size: 13px;
      }

      .message-input-container button {
        width: 28px;
        height: 28px;
      }

      .message-input-container button mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    @media (max-width: 480px) {
      .chat-container:not(.minimized):not(.closed) {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      .chat-container.minimized,
      .chat-container.closed {
        position: fixed;
        bottom: 20px;
        right: 20px;
        top: auto;
        left: auto;
        width: auto;
        height: auto;
        z-index: 1000;
      }

      .chat-window {
        height: 400px;
      }

      .chat-header {
        padding: 8px 12px;
        min-height: 40px;
        border-radius: 0;
      }

      .title-text {
        font-size: 16px;
      }

      .chat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .minimize-btn {
        width: 32px;
        height: 32px;
      }

      .minimize-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .room-header {
        padding: 2px 6px;
        min-height: 20px;
      }

      .room-title {
        font-size: 8px;
      }

      .custom-message-input {
        font-size: 12px; /* Readable size for small mobile screens */
        min-height: 32px;
        padding: 6px 12px;
      }

      .custom-message-input::placeholder {
        font-size: 12px;
      }

      .message-input-container {
        padding: 3px 6px;
        min-height: 36px;
      }

      .messages-container {
        padding: 4px;
      }
    }

    /* Minimized state */
    .chat-container.minimized .chat-window {
      height: 60px;
      overflow: hidden;
    }

    .chat-container.minimized .chat-content,
    .chat-container.minimized .chat-tabs {
      display: none;
    }

    /* Closed state */
    .chat-container.closed .chat-window {
      display: none;
    }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private destroy$ = new Subject<void>();

  // Component state
  isMinimized = true;  // Default to minimized on page load
  isClosed = false;
  selectedTabIndex = 0;
  
  // Chat data
  chatRooms: ChatRoom[] = [];
  messages: ChatMessage[] = [];
  currentRoom: string | null = null;
  currentUser: any = null;
  
  // UI state
  messageText = '';
  typingUsers: ChatTypingEvent[] = [];
  totalUnreadCount = 0;
  
  // Auto-scroll management
  private shouldScrollToBottom = true;
  private isNearBottom = true;
  
  // Sound notification
  private messageSound: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  isAudioInitialized = false; // Public for template access
  private pendingSoundPlay = false;
  
  // Touch event handling
  private touchStartTime = 0;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('💬 ChatWindow component initialized');
    
    // Get current user
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });

    // Subscribe to chat rooms
    this.chatService.rooms$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(rooms => {
      console.log('💬 Chat rooms updated:', rooms);
      // Filter to only show General Chat
      this.chatRooms = rooms.filter(room => room.name === 'General Chat');
      
      // Auto-select General Chat if available and no current room
      if (!this.currentRoom && this.chatRooms.length > 0) {
        const generalChat = this.chatRooms[0];
        this.selectRoom(generalChat._id, 0);
      }
    });

    // Subscribe to messages
    this.chatService.messages$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(messages => {
      console.log('💬 Messages updated:', messages);
      this.messages = messages;
      this.shouldScrollToBottom = true;
    });

    // Subscribe to typing indicators
    this.chatService.typingIndicator$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(typingEvent => {
      if (typingEvent.roomId === this.currentRoom) {
        this.updateTypingUsers();
      }
    });

    // Subscribe to unread count
    this.chatService.unreadCount$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => {
      this.totalUnreadCount = count;
    });

    // Subscribe to new messages for notifications
    this.chatService.messageReceived$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      // Show notification and play sound if message is not from current user
      if (message.userId !== this.currentUser?._id) {
        // Play sound for all incoming messages (not from current user)
        this.playMessageSound();
        
        // Show visual notification if chat is minimized/closed
        if (this.isMinimized || this.isClosed) {
          this.chatService.showMessageNotification(message);
        }
      }
    });

    // Load initial chat rooms
    this.chatService.loadChatRooms().subscribe({
      next: (rooms) => {
        console.log('💬 Initial chat rooms loaded:', rooms.length);
      },
      error: (error) => {
        console.error('💬 Error loading chat rooms:', error);
      }
    });

    // Load chat state from localStorage
    this.loadChatState();
    
    // Initialize message sound
    this.initializeMessageSound();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.isNearBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveChatState();
    
    // Clean up audio resources
    if (this.messageSound) {
      this.messageSound.pause();
      this.messageSound = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  /**
   * Toggle chat window (open/close)
   */
  toggleChat(): void {
    if (this.isClosed || this.isMinimized) {
      // Open chat - clear both closed and minimized states
      this.isClosed = false;
      this.isMinimized = false;
      // Scroll to bottom when reopening
      setTimeout(() => {
        this.shouldScrollToBottom = true;
        this.scrollToBottom();
      }, 100);
    } else {
      // Close chat
      this.isClosed = true;
      this.isMinimized = false;
    }
    this.saveChatState();
  }

  /**
   * Minimize chat window
   */
  minimize(): void {
    this.isMinimized = true;
    this.isClosed = false;
    this.saveChatState();
  }
  
  /**
   * Restore chat window from minimized state
   */
  restore(): void {
    this.isMinimized = false;
    this.isClosed = false;
    // Scroll to bottom when restoring from minimized state
    setTimeout(() => {
      this.shouldScrollToBottom = true;
      this.scrollToBottom();
    }, 100);
    this.saveChatState();
  }

  /**
   * Close chat window
   */
  close(): void {
    this.isClosed = true;
    this.isMinimized = false;
    this.saveChatState();
  }

  /**
   * Test sound functionality (useful for iOS)
   */
  testSound(): void {
    console.log('🔊 Testing notification sound...');
    this.playMessageSound();
  }

  /**
   * Handle touch start for toggle button
   */
  onToggleButtonTouchStart(event: TouchEvent): void {
    this.touchStartTime = Date.now();
    event.stopPropagation();
  }

  /**
   * Handle touch end for toggle button
   */
  onToggleButtonTouchEnd(event: TouchEvent): void {
    const touchDuration = Date.now() - this.touchStartTime;
    
    // Only trigger if it's a quick tap (less than 500ms)
    if (touchDuration < 500) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.isClosed) {
        this.toggleChat();
      } else {
        this.restore();
      }
    }
  }

  /**
   * Get unread count for General Chat
   */
  getGeneralChatUnreadCount(): number {
    const generalChat = this.chatRooms.find(room => room.name === 'General Chat');
    return generalChat?.unreadCount || 0;
  }

  /**
   * Select chat room
   */
  selectRoom(roomId: string, tabIndex: number): void {
    console.log('💬 Selecting room:', roomId);
    this.selectedTabIndex = tabIndex;
    this.currentRoom = roomId;
    this.chatService.setCurrentRoom(roomId);
    this.updateTypingUsers();
    this.shouldScrollToBottom = true;
  }

  /**
   * Send message
   */
  sendMessage(): void {
    if (!this.messageText.trim() || !this.currentRoom) return;

    const message = this.messageText.trim();
    this.messageText = '';

    // Stop typing indicator
    this.chatService.sendTypingIndicator(this.currentRoom, false);

    // Send message
    this.chatService.sendMessage(this.currentRoom, {
      content: message,
      type: 'text'
    }).subscribe({
      next: (sentMessage) => {
        console.log('💬 Message sent:', sentMessage);
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('💬 Error sending message:', error);
        // Restore message text on error
        this.messageText = message;
      }
    });
  }

  /**
   * Handle typing indicator
   */
  onTyping(): void {
    if (!this.currentRoom) return;
    
    this.chatService.sendTypingIndicator(this.currentRoom, true);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (!this.currentRoom) return;
    
    this.chatService.sendTypingIndicator(this.currentRoom, false);
  }

  /**
   * Update typing users for current room
   */
  updateTypingUsers(): void {
    if (!this.currentRoom) {
      this.typingUsers = [];
      return;
    }

    this.typingUsers = this.chatService.getTypingUsersForRoom(this.currentRoom)
      .filter(event => event.userId !== this.currentUser?._id); // Exclude current user
  }

  /**
   * Get typing indicator text
   */
  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    
    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0].username} is typing...`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0].username} and ${this.typingUsers[1].username} are typing...`;
    } else {
      return `${this.typingUsers.length} people are typing...`;
    }
  }

  /**
   * Format message time
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return date.toLocaleDateString();
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }

  /**
   * Track by functions for performance
   */
  trackByRoomId(index: number, room: ChatRoom): string {
    return room._id;
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message._id;
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Check if user is near bottom of messages
   */
  private checkIfNearBottom(): void {
    if (!this.messagesContainer) return;
    
    const element = this.messagesContainer.nativeElement;
    const threshold = 100; // pixels from bottom
    this.isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
  }

  /**
   * Show message notification
   */
  private showMessageNotification(message: ChatMessage): void {
    // For now, just log. Later we can integrate with PWA notifications
    console.log('💬 New message notification:', message.user?.fullName, message.content);
  }

  /**
   * Save chat state to localStorage
   */
  private saveChatState(): void {
    const state = {
      isMinimized: this.isMinimized,
      isClosed: this.isClosed,
      selectedTabIndex: this.selectedTabIndex,
      currentRoom: this.currentRoom
    };
    localStorage.setItem('chatWindowState', JSON.stringify(state));
  }

  /**
   * Load chat state from localStorage
   */
  private loadChatState(): void {
    try {
      const stateStr = localStorage.getItem('chatWindowState');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        this.isMinimized = state.isMinimized || false;
        this.isClosed = state.isClosed || false;
        this.selectedTabIndex = state.selectedTabIndex || 0;
        
        // Current room will be set when rooms are loaded
        if (state.currentRoom) {
          setTimeout(() => {
            const roomIndex = this.chatRooms.findIndex(room => room._id === state.currentRoom);
            if (roomIndex >= 0) {
              this.selectRoom(state.currentRoom, roomIndex);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading chat state:', error);
    }
  }
  
  /**
   * Initialize message sound with iOS compatibility
   */
  private initializeMessageSound(): void {
    try {
      // Create Audio element with better iOS support
      this.messageSound = new Audio();
      
      // Use a proper notification sound - iOS-compatible
      this.messageSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzSJ0fPOeSsFLWpF';
      this.messageSound.volume = 0.4;
      this.messageSound.preload = 'auto';
      
      // iOS-specific attributes
      this.messageSound.setAttribute('playsinline', 'true');
      this.messageSound.setAttribute('webkit-playsinline', 'true');
      
      // Initialize Web Audio Context for iOS
      if (typeof AudioContext !== 'undefined') {
        this.audioContext = new AudioContext();
      } else if (typeof (window as any).webkitAudioContext !== 'undefined') {
        this.audioContext = new (window as any).webkitAudioContext();
      }
      
      // Set up user interaction listeners to unlock audio on iOS
      this.setupAudioUnlockListeners();
      
    } catch (error) {
      console.warn('Could not initialize message sound:', error);
      this.messageSound = null;
    }
  }

  /**
   * Setup audio unlock listeners for iOS
   */
  private setupAudioUnlockListeners(): void {
    const unlockAudio = () => {
      if (!this.isAudioInitialized && this.messageSound) {
        // Play a silent sound to unlock audio on iOS
        const originalVolume = this.messageSound.volume;
        this.messageSound.volume = 0;
        this.messageSound.play().then(() => {
          this.messageSound!.volume = originalVolume;
          this.isAudioInitialized = true;
          console.log('📱 Audio unlocked for iOS');
          
          // Play pending sound if any
          if (this.pendingSoundPlay) {
            this.pendingSoundPlay = false;
            this.playMessageSound();
          }
        }).catch(error => {
          console.warn('Could not unlock audio:', error);
        });
        
        // Resume AudioContext if suspended (iOS requirement)
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      }
      
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    
    // Add listeners for user interactions
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  }
  
  /**
   * Play message notification sound with iOS support
   */
  private playMessageSound(): void {
    try {
      if (!this.messageSound) return;
      
      // If audio is not initialized on iOS, queue the sound for later
      if (!this.isAudioInitialized) {
        this.pendingSoundPlay = true;
        console.log('📱 Audio not unlocked yet, queueing sound for iOS');
        return;
      }
      
      // Reset the audio to the beginning
      this.messageSound.currentTime = 0;
      
      // Ensure volume is set correctly
      this.messageSound.volume = 0.4;
      
      // Play the sound with promise handling
      const playPromise = this.messageSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('📱 Message sound played successfully');
        }).catch(error => {
          console.warn('Could not play message sound:', error);
          
          // Fallback: try to create a beep using Web Audio API
          this.playFallbackBeep();
        });
      }
      
    } catch (error) {
      console.warn('Error playing message sound:', error);
      this.playFallbackBeep();
    }
  }

  /**
   * Fallback beep using Web Audio API for iOS
   */
  private playFallbackBeep(): void {
    try {
      if (this.audioContext && this.audioContext.state === 'running') {
        // Create a simple beep tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure the beep
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz
        oscillator.type = 'sine';
        
        // Configure volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        // Play the beep
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        
        console.log('📱 Fallback beep played using Web Audio API');
      }
    } catch (error) {
      console.warn('Could not play fallback beep:', error);
    }
  }
}