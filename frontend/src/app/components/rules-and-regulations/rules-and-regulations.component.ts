import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rules-and-regulations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="rules-container">
      <div class="header-section">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="page-title">
          <mat-icon class="title-icon">gavel</mat-icon>
          Rules and Regulations
        </h1>
      </div>

      <!-- Tennis Court Rules -->
      <mat-card class="rules-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="section-icon">sports_tennis</mat-icon>
          <mat-card-title>Rich Town 2 Tennis Club</mat-card-title>
          <mat-card-subtitle>Court Usage and General Rules</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="rules-section">
            <div class="rule-item">
              <mat-icon class="rule-icon">schedule</mat-icon>
              <div class="rule-content">
                <h3>Reservation Policy</h3>
                <p>Reservation is on per schedule basis. Only members are allowed to reserve the tennis court.</p>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">person_pin</mat-icon>
              <div class="rule-content">
                <h3>Member Presence</h3>
                <p>Member who reserved the court must be present or playing inside the court. Gate will be open for you on your scheduled time.</p>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">payment</mat-icon>
              <div class="rule-content">
                <h3>Payment Policy</h3>
                <p><strong>Pay before you play.</strong></p>
                <ul>
                  <li>Members: ₱20 per hour</li>
                  <li>Non-Members: ₱50 per hour</li>
                  <li>Lights Usage: ₱100 per hour</li>
                </ul>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">cancel</mat-icon>
              <div class="rule-content">
                <h3>Cancellation Policy</h3>
                <p>Cancellation/reservation must be communicated through group chat.</p>
                <ul>
                  <li>Cancellation should be made at least 12 hours before the schedule</li>
                  <li>Immediate cancellation will be charged ₱100</li>
                </ul>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">block</mat-icon>
              <div class="rule-content">
                <h3>Non-Payment Consequences</h3>
                <p>Non-payment for 3 times will result in denial of playing inside the court and will not be given any schedule.</p>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">home</mat-icon>
              <div class="rule-content">
                <h3>Property Respect</h3>
                <p>Rich Town 2 Club property is to be respected at all times.</p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Coin System Rules -->
      <mat-card class="rules-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="section-icon coin-icon">monetization_on</mat-icon>
          <mat-card-title>Coin System Rules</mat-card-title>
          <mat-card-subtitle>Digital Currency Guidelines</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="rules-section">
            <div class="rule-item">
              <mat-icon class="rule-icon">account_balance_wallet</mat-icon>
              <div class="rule-content">
                <h3>Initial Coin Balance</h3>
                <p>All new members receive 100 coins upon registration approval.</p>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">trending_down</mat-icon>
              <div class="rule-content">
                <h3>Coin Consumption</h3>
                <p>Coins are consumed when browsing pages within the application. The consumption rate is configurable by administrators.</p>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">admin_panel_settings</mat-icon>
              <div class="rule-content">
                <h3>Administrative Actions</h3>
                <p>Club administrators have the authority to:</p>
                <ul>
                  <li>Award bonus coins for good behavior or participation</li>
                  <li>Deduct coins as penalties for rule violations</li>
                  <li>Adjust coin consumption rates</li>
                  <li>Monitor all coin transactions with audit trails</li>
                </ul>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">shopping_cart</mat-icon>
              <div class="rule-content">
                <h3>Earning and Purchasing Coins</h3>
                <p>Members can obtain additional coins through:</p>
                <ul>
                  <li>Participating in club activities and events</li>
                  <li>Purchasing coins through the payment system</li>
                  <li>Receiving administrator bonuses for positive contributions</li>
                  <li>Completing club challenges and competitions</li>
                </ul>
              </div>
            </div>

            <div class="rule-item">
              <mat-icon class="rule-icon">visibility</mat-icon>
              <div class="rule-content">
                <h3>Transparency</h3>
                <p>All coin transactions are recorded and can be viewed in your coin history for complete transparency.</p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Footer -->
      <div class="footer-section">
        <p class="footer-text">
          <mat-icon>info</mat-icon>
          These rules are subject to updates and amendments by club management. 
          Members will be notified of any changes through official communications.
        </p>
        <button mat-raised-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styleUrl: './rules-and-regulations.component.scss'
})
export class RulesAndRegulationsComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}