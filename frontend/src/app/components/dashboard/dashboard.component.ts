import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { WebSocketService, OpenPlayNotificationEvent } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';
import { PWANotificationService } from '../../services/pwa-notification.service';
import { OpenPlayNotificationModalComponent } from '../open-play-notification-modal/open-play-notification-modal.component';
import { ModalManagerService } from '../../services/modal-manager.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatDialogModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Action Cards Grid -->
      <div class="dashboard-content">
        
        <div class="action-grid">
          <!-- Reserve Court -->
          <mat-card class="action-card primary-action" data-icon="calendar_today" data-title="Reserve Court" (click)="testNavigation()">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="mobile-card-title">Reserve Court</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">calendar_today</mat-icon>
              <mat-card-title>Reserve Court</mat-card-title>
              <mat-card-subtitle>Book your next tennis session</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Schedule your court time and invite other players.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="primary-btn" (click)="testNavigation()">
                <mat-icon>calendar_today</mat-icon>
                Book Now
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- My Reservations -->
          <mat-card class="action-card" data-icon="event" data-title="My Reservations" (click)="navigateTo('/my-reservations')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>event</mat-icon>
            </div>
            <div class="mobile-card-title">My Reservations</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">event</mat-icon>
              <mat-card-title>My Reservations</mat-card-title>
              <mat-card-subtitle>View and manage your bookings</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Check upcoming games and payment status.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="info-btn" (click)="navigateTo('/my-reservations')">
                <mat-icon>event</mat-icon>
                View All Bookings
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Payments -->
          <mat-card class="action-card" data-icon="payment" data-title="Payments" (click)="navigateTo('/payments')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>payment</mat-icon>
            </div>
            <div class="mobile-card-title">Payments</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">payment</mat-icon>
              <mat-card-title>Payments</mat-card-title>
              <mat-card-subtitle>Manage your payments and coins</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>View payment history and manage your coin balance.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="primary-btn" (click)="navigateTo('/payments')">
                <mat-icon>payment</mat-icon>
                Manage Payments
              </button>
              <button mat-raised-button class="warning-btn" (click)="navigateTo('/coins')">
                <mat-icon>monetization_on</mat-icon>
                Coin Management
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Open Play -->
          <mat-card class="action-card" data-icon="sports_tennis" data-title="Open Play" (click)="navigateTo('/polls')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>sports_tennis</mat-icon>
            </div>
            <div class="mobile-card-title">Open Play</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">sports_tennis</mat-icon>
              <mat-card-title>Open Play</mat-card-title>
              <mat-card-subtitle>Join casual tennis sessions</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Find and join open play sessions with other members.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="info-btn" (click)="navigateTo('/polls')">
                <mat-icon>sports_tennis</mat-icon>
                Join Open Play
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Rankings -->
          <mat-card class="action-card" data-icon="leaderboard" data-title="Player Rankings" (click)="navigateTo('/rankings')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>leaderboard</mat-icon>
            </div>
            <div class="mobile-card-title">Player Rankings</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">leaderboard</mat-icon>
              <mat-card-title>Player Rankings</mat-card-title>
              <mat-card-subtitle>See how you stack up</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>View player rankings and tournament standings.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="success-btn" (click)="navigateTo('/rankings')">
                <mat-icon>leaderboard</mat-icon>
                View Rankings
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Weather Info -->
          <mat-card class="action-card" data-icon="wb_sunny" data-title="Weather Forecast" (click)="navigateTo('/weather')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>wb_sunny</mat-icon>
            </div>
            <div class="mobile-card-title">Weather Forecast</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">wb_sunny</mat-icon>
              <mat-card-title>Weather Forecast</mat-card-title>
              <mat-card-subtitle>Plan your games accordingly</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Check weather conditions for your court time.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="warning-btn" (click)="navigateTo('/weather')">
                <mat-icon>wb_sunny</mat-icon>
                Check Weather
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Member Directory -->
          <mat-card class="action-card" data-icon="people" data-title="Member Directory" (click)="navigateTo('/members')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="mobile-card-title">Member Directory</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">people</mat-icon>
              <mat-card-title>Member Directory</mat-card-title>
              <mat-card-subtitle>Connect with other players</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Find and connect with fellow tennis players.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="success-btn" (click)="navigateTo('/members')">
                <mat-icon>people</mat-icon>
                Browse Members
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Suggestions & Complaints -->
          <mat-card class="action-card" data-icon="feedback" data-title="Feedback" (click)="navigateTo('/suggestions')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>feedback</mat-icon>
            </div>
            <div class="mobile-card-title">Feedback</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">feedback</mat-icon>
              <mat-card-title>Feedback</mat-card-title>
              <mat-card-subtitle>Share suggestions or report issues</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Help us improve by sharing your feedback with the management.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="accent-btn" (click)="navigateTo('/suggestions')">
                <mat-icon>comment</mat-icon>
                Submit Feedback
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Rules & Regulations -->
          <mat-card class="action-card" data-icon="gavel" data-title="Rules & Regulations" (click)="navigateTo('/rules')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>gavel</mat-icon>
            </div>
            <div class="mobile-card-title">Rules & Regulations</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">gavel</mat-icon>
              <mat-card-title>Rules & Regulations</mat-card-title>
              <mat-card-subtitle>Club guidelines and policies</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Review club rules, court usage policies, and coin system guidelines.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="info-btn" (click)="navigateTo('/rules')">
                <mat-icon>description</mat-icon>
                View Rules
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Credit Management (Admin only for now) -->
          <mat-card class="action-card" data-icon="account_balance" data-title="Credit Management" (click)="navigateTo('/credits')" *ngIf="isAdmin">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="mobile-card-title">Credit Management</div>
            
            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">account_balance</mat-icon>
              <mat-card-title>Credit Management</mat-card-title>
              <mat-card-subtitle>Manage your prepaid credits</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>View credit balance, transaction history, and top up credits for seamless bookings.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="success-btn" (click)="navigateTo('/credits')">
                <mat-icon>account_balance</mat-icon>
                View Credits
              </button>
              <button mat-raised-button class="primary-btn" (click)="navigateTo('/credit-topup')">
                <mat-icon>add</mat-icon>
                Add Credits
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Court Usage Report -->
          <mat-card class="action-card" data-icon="analytics" data-title="Court Usage Report" (click)="navigateTo('/court-usage-report')">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>analytics</mat-icon>
            </div>
            <div class="mobile-card-title">Court Usage Report</div>

            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">analytics</mat-icon>
              <mat-card-title>Court Usage Report</mat-card-title>
              <mat-card-subtitle>View member court usage statistics</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Access detailed court usage statistics and member activity reports.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="info-btn" (click)="navigateTo('/court-usage-report')">
                <mat-icon>analytics</mat-icon>
                View Report
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Official Tennis App Store -->
          <mat-card class="action-card" data-icon="store" data-title="Official Tennis App Store" (click)="openTennisAppStore()">
            <!-- Mobile Icon -->
            <div class="mobile-card-icon">
              <mat-icon>store</mat-icon>
            </div>
            <div class="mobile-card-title">Official Tennis App Store</div>

            <!-- Desktop Content -->
            <mat-card-header>
              <mat-icon mat-card-avatar class="action-icon">store</mat-icon>
              <mat-card-title>Official Tennis App Store</mat-card-title>
              <mat-card-subtitle>Buy & sell tennis gear with fellow members</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Browse tennis equipment for sale by members or list your own gear to sell to the tennis community.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button class="primary-btn" (click)="openTennisAppStore()">
                <mat-icon>open_in_new</mat-icon>
                Browse Marketplace
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- Admin Section -->
        <div class="admin-section" *ngIf="isAdmin">
          <h2 class="section-title admin-title">
            <mat-icon>admin_panel_settings</mat-icon>
            Administration
          </h2>
          
          <div class="admin-grid">
            <!-- Member Management -->
            <mat-card class="action-card admin-card" data-icon="people_alt" data-title="Member Management" (click)="navigateTo('/admin/members')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>people_alt</mat-icon>
              </div>
              <div class="mobile-card-title">Member Management</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">people_alt</mat-icon>
                <mat-card-title>Member Management</mat-card-title>
                <mat-card-subtitle>Manage club members</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Approve registrations and manage member accounts.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/members')">
                  <mat-icon>people_alt</mat-icon>
                  Manage Members
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Reports & Analytics -->
            <mat-card class="action-card admin-card" data-icon="analytics" data-title="Reports & Analytics" (click)="navigateTo('/admin/reports')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>analytics</mat-icon>
              </div>
              <div class="mobile-card-title">Reports & Analytics</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">analytics</mat-icon>
                <mat-card-title>Reports & Analytics</mat-card-title>
                <mat-card-subtitle>View system reports</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Generate reports and view system analytics.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/reports')">
                  <mat-icon>analytics</mat-icon>
                  View Reports
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Poll Management -->
            <mat-card class="action-card admin-card" data-icon="poll" data-title="Poll Management" (click)="navigateTo('/admin/polls')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>poll</mat-icon>
              </div>
              <div class="mobile-card-title">Poll Management</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">poll</mat-icon>
                <mat-card-title>Poll Management</mat-card-title>
                <mat-card-subtitle>Create and manage polls</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Create polls and manage club voting.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/polls')">
                  <mat-icon>poll</mat-icon>
                  Manage Polls
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Coin Management -->
            <mat-card class="action-card admin-card" data-icon="monetization_on" data-title="Coin Management" (click)="navigateTo('/admin/coins')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>monetization_on</mat-icon>
              </div>
              <div class="mobile-card-title">Coin Management</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">monetization_on</mat-icon>
                <mat-card-title>Coin Management</mat-card-title>
                <mat-card-subtitle>Manage member coins</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Award and manage member coin balances.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/coins')">
                  <mat-icon>monetization_on</mat-icon>
                  Manage Coins
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Credit Management -->
            <mat-card class="action-card admin-card" data-icon="account_balance" data-title="Credit Management" (click)="navigateTo('/admin/credits')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="mobile-card-title">Credit Management</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">account_balance</mat-icon>
                <mat-card-title>Credit Management</mat-card-title>
                <mat-card-subtitle>Manage member prepaid credits</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>View and manage member credit balances and transactions.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/credits')">
                  <mat-icon>account_balance</mat-icon>
                  Manage Credits
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Suggestions Management -->
            <mat-card class="action-card admin-card" data-icon="feedback" data-title="Feedback Management" (click)="navigateTo('/admin/suggestions')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>feedback</mat-icon>
              </div>
              <div class="mobile-card-title">Feedback Management</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">feedback</mat-icon>
                <mat-card-title>Feedback Management</mat-card-title>
                <mat-card-subtitle>Manage member feedback</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Review and respond to member suggestions and complaints.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/suggestions')">
                  <mat-icon>feedback</mat-icon>
                  Manage Feedback
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Site Analytics -->
            <mat-card class="action-card admin-card" data-icon="folder" data-title="Site Analytics" (click)="navigateTo('/admin/analytics')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>folder</mat-icon>
              </div>
              <div class="mobile-card-title">Site Analytics</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">analytics</mat-icon>
                <mat-card-title>Site Analytics</mat-card-title>
                <mat-card-subtitle>View usage statistics</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Monitor page views, user activity, and engagement metrics.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/analytics')">
                  <mat-icon>analytics</mat-icon>
                  View Analytics
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Financial Report -->
            <mat-card class="action-card admin-card" data-icon="account_balance" data-title="Financial Report" (click)="navigateTo('/admin/financial-report')">
              <!-- Mobile Icon -->
              <div class="mobile-card-icon">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="mobile-card-title">Financial Report</div>
              
              <!-- Desktop Content -->
              <mat-card-header>
                <mat-icon mat-card-avatar class="action-icon admin-icon">account_balance</mat-icon>
                <mat-card-title>Financial Report</mat-card-title>
                <mat-card-subtitle>View club financial statements</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Access detailed financial reports and revenue analysis.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="admin-btn" (click)="navigateTo('/admin/financial-report')">
                  <mat-icon>account_balance</mat-icon>
                  View Report
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>

        <!-- Partner Section -->
        <div class="partner-section">
          <h2 class="section-title partner-title">
            <mat-icon>handshake</mat-icon>
            Our Club Partners
          </h2>

          <div class="partner-grid">
            <!-- Helen's Kitchen Partner -->
            <mat-card class="partner-card food-partner" (click)="openHelensKitchen()">
              <mat-card-header>
                <img src="helens-kitchen-logo.jpg" alt="Helen's Kitchen Logo" mat-card-avatar class="partner-logo-header">
                <mat-card-title>Helen's Kitchen</mat-card-title>
                <mat-card-subtitle>Delicious Meals & Tennis Club Catering</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="partner-content">
                  <p>Looking for great food after your tennis match? Check out Helen's Kitchen for authentic, delicious meals!</p>
                  <div class="partner-features">
                    <div class="feature-item">
                      <mat-icon>local_dining</mat-icon>
                      <span>Fresh Daily Menu</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>delivery_dining</mat-icon>
                      <span>Court-side Delivery</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>group</mat-icon>
                      <span>Group Catering</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="partner-btn food-btn" (click)="openHelensKitchen()">
                  <mat-icon>open_in_new</mat-icon>
                  View Menu
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Baseline Gearhub Partner -->
            <mat-card class="partner-card equipment-partner" (click)="openBaselineGearhub()">
              <mat-card-header>
                <img src="baseline-gearhub-logo.png" alt="Baseline Gearhub Logo" mat-card-avatar class="partner-logo-header baseline-logo" loading="lazy">
                <mat-card-title>Baseline Gearhub</mat-card-title>
                <mat-card-subtitle>Your hub for tennis & pickleball gear</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="partner-content">
                  <p>Elevate your game with premium equipment for both tennis and pickleball! Discover quality rackets, paddles, and accessories for every skill level.</p>
                  <div class="partner-features">
                    <div class="feature-item">
                      <mat-icon>sports_tennis</mat-icon>
                      <span>Tennis & Pickleball</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>shopping_cart</mat-icon>
                      <span>Gear & Accessories</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>local_shipping</mat-icon>
                      <span>Fast Delivery</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="partner-btn equipment-btn" (click)="openBaselineGearhub()">
                  <mat-icon>open_in_new</mat-icon>
                  Shop Now
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- PlaySquad Partner -->
            <mat-card class="partner-card general-partner" (click)="openPlaySquad()">
              <mat-card-header>
                <img src="playsquad-logo.png" alt="PlaySquad Logo" mat-card-avatar class="partner-logo-header playsquad-logo" loading="lazy">
                <mat-card-title>PlaySquad</mat-card-title>
                <mat-card-subtitle>Find teammates and organize sports activities</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="partner-content">
                  <p>Connect with fellow sports enthusiasts and organize games effortlessly! Build your sports community and never play alone again.</p>
                  <div class="partner-features">
                    <div class="feature-item">
                      <mat-icon>group</mat-icon>
                      <span>Team Building</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>event</mat-icon>
                      <span>Event Organization</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>sports</mat-icon>
                      <span>Sports Community</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button class="partner-btn general-btn" (click)="openPlaySquad()">
                  <mat-icon>open_in_new</mat-icon>
                  Join Now
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAdmin = false;
  private apiUrl = environment.apiUrl;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private analyticsService: AnalyticsService,
    private router: Router,
    private dialog: MatDialog,
    private http: HttpClient,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService,
    private pwaNotificationService: PWANotificationService,
    private modalManagerService: ModalManagerService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.isAdmin = this.authService.isAdmin();
    
    // Subscribe to user changes
    const userSub = this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
    });
    this.subscriptions.push(userSub);

    // Set up WebSocket listeners for real-time open play notifications
    this.setupWebSocketListeners();

    // Check for any pending PWA notifications that were clicked while app was closed
    this.pwaNotificationService.checkAndShowPendingNotification();
  }

  testNavigation(): void {
    this.navigateTo('/reservations');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  openHelensKitchen(): void {
    // Track partner click analytics
    this.analyticsService.trackUserActivity('partner_click', 'dashboard', {
      partnerName: "Helen's Kitchen",
      partnerUrl: 'https://helens-kitchen.netlify.app/',
      partnerType: 'food',
      clickSource: 'partner_card'
    });

    window.open('https://helens-kitchen.netlify.app/', '_blank');
  }

  openBaselineGearhub(): void {
    // Track partner click analytics
    this.analyticsService.trackUserActivity('partner_click', 'dashboard', {
      partnerName: 'Baseline Gearhub',
      partnerUrl: 'https://tennis-marketplace.netlify.app/',
      partnerType: 'equipment',
      clickSource: 'partner_card'
    });

    window.open('https://tennis-marketplace.netlify.app/', '_blank');
  }

  openTennisAppStore(): void {
    // Track partner click analytics
    this.analyticsService.trackUserActivity('partner_click', 'dashboard', {
      partnerName: 'Official Tennis App Store',
      partnerUrl: 'https://tennis-marketplace.netlify.app/browse',
      partnerType: 'app_store',
      clickSource: 'partner_card'
    });

    window.open('https://tennis-marketplace.netlify.app/browse', '_blank');
  }

  openPlaySquad(): void {
    // Track partner click analytics
    this.analyticsService.trackUserActivity('partner_click', 'dashboard', {
      partnerName: 'PlaySquad',
      partnerUrl: 'https://play-squad.netlify.app/',
      partnerType: 'general',
      clickSource: 'partner_card'
    });

    window.open('https://play-squad.netlify.app/', '_blank');
  }

  /**
   * Set up WebSocket listeners for real-time notifications
   */
  private setupWebSocketListeners(): void {
    console.log('🎾 Dashboard: Setting up WebSocket listeners');

    // Listen for open play notifications
    const openPlaySub = this.webSocketService.openPlayNotifications$.subscribe(
      (notification: OpenPlayNotificationEvent) => {
        console.log('🎾 Dashboard: Received open play notification:', notification);
        this.handleOpenPlayNotification(notification);
      }
    );
    this.subscriptions.push(openPlaySub);

    // Listen for WebSocket connection status
    const connectionSub = this.webSocketService.isConnected$.subscribe(
      (connected: boolean) => {
        console.log('🔌 Dashboard: WebSocket connection status:', connected ? 'Connected' : 'Disconnected');
      }
    );
    this.subscriptions.push(connectionSub);
  }

  /**
   * Handle incoming open play notifications and show auto-modal
   */
  private handleOpenPlayNotification(notification: OpenPlayNotificationEvent): void {
    console.log('🎾 Dashboard: Handling open play notification');
    console.log('🎾 Dashboard: Notification data:', notification);
    console.log('🎾 Dashboard: startTime:', notification.data.startTime, 'endTime:', notification.data.endTime);
    
    // Only show modal for new open play events
    if (notification.type === 'open_play_created') {
      console.log('🎾 Dashboard: Showing auto-modal for new open play event');
      
      // Convert WebSocket notification to the format expected by the modal
      const modalNotification = {
        id: notification.data.pollId,
        type: 'open_play_new' as const,
        title: 'New Open Play Event!',
        message: `${notification.data.title} - Vote to join!`,
        eventDate: new Date(notification.data.eventDate),
        startTime: notification.data.startTime,
        endTime: notification.data.endTime,
        confirmedPlayers: notification.data.confirmedPlayers,
        maxPlayers: notification.data.maxPlayers,
        pollId: notification.data.pollId,
        hasVoted: false
      };

      // Show the modal automatically using the modal manager
      const dialogRef = this.modalManagerService.showOpenPlayModal(
        { notifications: [modalNotification] },
        { panelClass: ['open-play-modal', 'auto-triggered'] }
      );

      // Handle modal result if modal was actually opened
      if (dialogRef) {
        dialogRef.afterClosed().subscribe(result => {
          console.log('🎾 Dashboard: Auto-modal closed with result:', result);
          if (result === 'navigate-polls') {
            console.log('🎾 Dashboard: Navigating to polls page');
            this.navigateTo('/polls');
          }
        });
      }

      // Refresh notifications to keep them in sync
      this.notificationService.refreshNotifications();
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}