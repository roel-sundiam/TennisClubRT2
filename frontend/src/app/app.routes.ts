import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReservationsComponent } from './components/reservations/reservations.component';
import { RegisterComponent } from './components/register/register.component';
import { MyReservationsComponent } from './components/my-reservations/my-reservations.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { CoinDashboardComponent } from './components/coin-dashboard/coin-dashboard.component';
import { CoinPurchaseComponent } from './components/coin-purchase/coin-purchase.component';
import { CoinHistoryComponent } from './components/coin-history/coin-history.component';
import { AdminCoinManagementComponent } from './components/admin-coin-management/admin-coin-management.component';
import { AdminCreditManagementComponent } from './components/admin-credit-management/admin-credit-management.component';
import { CreditTopupComponent } from './components/credit-topup/credit-topup.component';
import { CreditHistoryComponent } from './components/credit-history/credit-history.component';
import { CreditDashboardComponent } from './components/credit-dashboard/credit-dashboard.component';
import { MembersDirectoryComponent } from './components/members-directory/members-directory.component';
import { MemberProfileComponent } from './components/member-profile/member-profile.component';
import { CourtReceiptsReportComponent } from './components/court-receipts-report/court-receipts-report.component';
import { AdminPollManagementComponent } from './components/admin-poll-management/admin-poll-management.component';
import { PollsComponent } from './components/polls/polls.component';
import { RankingsComponent } from './components/rankings/rankings.component';
import { WeatherComponent } from './components/weather/weather.component';
import { SuggestionsComponent } from './components/suggestions/suggestions.component';
import { AdminSuggestionsComponent } from './components/admin-suggestions/admin-suggestions.component';
import { AdminAnalyticsComponent } from './components/admin-analytics/admin-analytics.component';
import { CourtUsageReportComponent } from './components/court-usage-report/court-usage-report.component';
import { FinancialReportComponent } from './components/financial-report/financial-report.component';
import { AdminMemberManagementComponent } from './components/admin-member-management/admin-member-management.component';
import { authGuard, loginGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [loginGuard]
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  // Court reservation
  { 
    path: 'reservations', 
    component: ReservationsComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'my-reservations', 
    component: MyReservationsComponent,
    canActivate: [authGuard]
  },
  // Payment management
  { 
    path: 'payments', 
    component: PaymentsComponent,
    canActivate: [authGuard]
  },
  // Coin management
  { 
    path: 'coins', 
    component: CoinDashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'coins/purchase', 
    component: CoinPurchaseComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'coins/history', 
    component: CoinHistoryComponent,
    canActivate: [authGuard]
  },
  // Admin coin management
  { 
    path: 'admin/coins', 
    component: AdminCoinManagementComponent,
    canActivate: [authGuard, adminGuard]
  },
  // Admin credit management
  { 
    path: 'admin/credits', 
    component: AdminCreditManagementComponent,
    canActivate: [authGuard, adminGuard]
  },
  // Credit management
  { 
    path: 'credits', 
    component: CreditDashboardComponent,
    canActivate: [authGuard]
  },
  // Credit top-up
  { 
    path: 'credit-topup', 
    component: CreditTopupComponent,
    canActivate: [authGuard]
  },
  // Credit history
  { 
    path: 'credit-history', 
    component: CreditHistoryComponent,
    canActivate: [authGuard]
  },
  // Member directory
  { 
    path: 'members', 
    component: MembersDirectoryComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'members/:id', 
    component: MemberProfileComponent,
    canActivate: [authGuard]
  },
  // Admin reports
  { 
    path: 'admin/reports', 
    component: CourtReceiptsReportComponent,
    canActivate: [authGuard, adminGuard]
  },
  // Polls and voting
  { 
    path: 'polls', 
    component: PollsComponent,
    canActivate: [authGuard]
  },
  // Rankings and leaderboard
  { 
    path: 'rankings', 
    component: RankingsComponent,
    canActivate: [authGuard]
  },
  // Weather forecast
  { 
    path: 'weather', 
    component: WeatherComponent,
    canActivate: [authGuard]
  },
  // Suggestions and complaints
  { 
    path: 'suggestions', 
    component: SuggestionsComponent,
    canActivate: [authGuard]
  },
  // Court Usage Report
  { 
    path: 'court-usage-report', 
    component: CourtUsageReportComponent,
    canActivate: [authGuard]
  },
  // Financial Report (Admin only)
  { 
    path: 'admin/financial-report', 
    component: FinancialReportComponent,
    canActivate: [authGuard, adminGuard]
  },
  { path: 'profile', redirectTo: '/dashboard' },
  { 
    path: 'admin/members', 
    component: AdminMemberManagementComponent,
    canActivate: [authGuard, adminGuard]
  },
  { path: 'admin/polls', component: AdminPollManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/suggestions', component: AdminSuggestionsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/analytics', component: AdminAnalyticsComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
