import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from './auth.service';
import { CoinService } from './coin.service';
import { InsufficientCoinsModalComponent, InsufficientCoinsData } from '../components/insufficient-coins-modal/insufficient-coins-modal.component';
import { environment } from '../../environments/environment';

export interface PageVisitConfig {
  route: string;
  coinCost: number;
  requiresCoins: boolean;
  description: string;
}

export interface PageVisitResponse {
  success: boolean;
  data: {
    coinsDeducted: number;
    remainingBalance: number;
    route: string;
    timestamp: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PageVisitTrackerService {
  private apiUrl = environment.apiUrl;
  private currentRoute = '';
  private lastVisitTime = 0;
  private visitDebounceTime = 3000; // 3 seconds debounce to avoid duplicate charges
  
  // Default page visit costs (can be configured from backend)
  private pageConfigs: PageVisitConfig[] = [
    { route: '/dashboard', coinCost: 0, requiresCoins: false, description: 'Dashboard access' },
    { route: '/my-reservations', coinCost: 0, requiresCoins: false, description: 'View my reservations' },
    { route: '/payments', coinCost: 0, requiresCoins: false, description: 'Payment management' },
    { route: '/reservations', coinCost: 1, requiresCoins: true, description: 'Create court reservations' },
    { route: '/members', coinCost: 1, requiresCoins: true, description: 'Member directory' },
    { route: '/polls', coinCost: 1, requiresCoins: true, description: 'Club polls' },
    { route: '/weather', coinCost: 1, requiresCoins: true, description: 'Weather information' },
    { route: '/profile', coinCost: 0, requiresCoins: false, description: 'User profile' },
    { route: '/coins', coinCost: 0, requiresCoins: false, description: 'Coin management' },
    { route: '/admin', coinCost: 0, requiresCoins: false, description: 'Admin areas' }
  ];

  private pageVisitSubject = new BehaviorSubject<PageVisitResponse | null>(null);
  public pageVisit$ = this.pageVisitSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private coinService: CoinService,
    private dialog: MatDialog
  ) {
    this.initializeRouteTracking();
  }

  private initializeRouteTracking(): void {
    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      distinctUntilChanged(),
      debounceTime(500) // Debounce rapid navigation
    ).subscribe((event: NavigationEnd) => {
      this.handleRouteChange(event.url);
    });

    // Also listen to auth loading state changes to re-check current route when loading completes
    this.authService.isLoading$.subscribe(isLoading => {
      if (!isLoading && this.authService.isAuthenticated()) {
        // Auth loading completed and user is authenticated, check current route
        setTimeout(() => {
          const currentUrl = this.router.url;
          if (currentUrl && currentUrl !== this.currentRoute) {
            console.log(`🔄 Auth loading completed, checking current route: ${currentUrl}`);
            this.handleRouteChange(currentUrl);
          }
        }, 100); // Small delay to ensure everything is settled
      }
    });
  }

  private handleRouteChange(url: string): void {
    // Skip tracking if user is not authenticated or auth is still loading
    if (!this.authService.isAuthenticated() || this.authService.isLoading()) {
      console.log(`⏸️ Skipping page visit tracking: authenticated=${this.authService.isAuthenticated()}, loading=${this.authService.isLoading()}`);
      return;
    }

    const now = Date.now();

    // Avoid charging for rapid navigation or same page refreshes
    if (this.currentRoute === url && (now - this.lastVisitTime) < this.visitDebounceTime) {
      return;
    }

    this.currentRoute = url;
    this.lastVisitTime = now;

    const pageConfig = this.getPageConfig(url);

    // Only process if page requires coins and costs > 0
    if (pageConfig && pageConfig.requiresCoins && pageConfig.coinCost > 0) {
      console.log(`💰 Page visit: ${url} requires ${pageConfig.coinCost} coins`);
      this.processPageVisit(pageConfig);
    }
  }

  private getPageConfig(url: string): PageVisitConfig | null {
    // Find the most specific matching route
    const matchingConfigs = this.pageConfigs.filter(config => {
      return url.startsWith(config.route);
    });

    if (matchingConfigs.length === 0) {
      return null;
    }

    // Return the most specific match (longest route path)
    return matchingConfigs.reduce((longest, current) => {
      return current.route.length > longest.route.length ? current : longest;
    });
  }

  private processPageVisit(pageConfig: PageVisitConfig): void {
    const currentBalance = this.authService.getCoinBalance();
    
    if (currentBalance < pageConfig.coinCost) {
      // Insufficient coins - show warning but allow access
      console.warn(`Insufficient coins for ${pageConfig.route}. Required: ${pageConfig.coinCost}, Available: ${currentBalance}`);
      this.handleInsufficientCoins(pageConfig);
      return;
    }

    // Record the page visit and deduct coins
    this.recordPageVisit(pageConfig).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`Page visit recorded: ${pageConfig.route} (-${response.data.coinsDeducted} coins)`);
          
          // Update coin balance
          this.authService.updateCoinBalance(response.data.remainingBalance);
          this.coinService.updateBalance(response.data.remainingBalance);
          
          // Emit page visit event
          this.pageVisitSubject.next(response);
          
          // Check for low balance warning
          if (response.data.remainingBalance < 10) {
            this.showLowBalanceWarning(response.data.remainingBalance);
          }
        }
      },
      error: (error) => {
        console.error('Error recording page visit:', error);
        // Don't block navigation on API errors
      }
    });
  }

  private recordPageVisit(pageConfig: PageVisitConfig): Observable<PageVisitResponse> {
    return this.http.post<PageVisitResponse>(`${this.apiUrl}/coins/page-visit`, {
      route: pageConfig.route,
      coinCost: pageConfig.coinCost,
      description: pageConfig.description
    });
  }

  private handleInsufficientCoins(pageConfig: PageVisitConfig): void {
    // Block access and show modal
    console.warn(`🚫 BLOCKING ACCESS: Insufficient coins for ${pageConfig.route}. Required: ${pageConfig.coinCost}, Available: ${this.authService.getCoinBalance()}`);
    
    // Show blocking warning modal
    this.showInsufficientCoinsWarning(pageConfig);
    
    // Navigate back to previous page or dashboard
    this.router.navigate(['/dashboard']);
    
    // Emit blocking event
    const blockingResponse: PageVisitResponse = {
      success: false,
      data: {
        coinsDeducted: 0,
        remainingBalance: this.authService.getCoinBalance(),
        route: pageConfig.route,
        timestamp: new Date().toISOString()
      },
      message: `Access blocked: Insufficient coins for ${pageConfig.description}. Required: ${pageConfig.coinCost} coins.`
    };
    
    this.pageVisitSubject.next(blockingResponse);
  }

  private showInsufficientCoinsWarning(pageConfig: PageVisitConfig): void {
    // Show prominent blocking notification
    console.log(`🚫 BLOCKED: Cannot access ${pageConfig.route} - insufficient coins`);
    
    // Open modern modal dialog
    const dialogRef = this.dialog.open(InsufficientCoinsModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        requiredCoins: pageConfig.coinCost,
        currentBalance: this.authService.getCoinBalance(),
        featureName: pageConfig.description,
        targetRoute: pageConfig.route
      } as InsufficientCoinsData
    });

    // Optional: Handle dialog result
    dialogRef.afterClosed().subscribe(result => {
      console.log('Insufficient coins modal closed:', result);
    });
  }

  private showLowBalanceWarning(remainingBalance: number): void {
    // This could trigger a toast notification or modal
    console.warn(`Low coin balance: ${remainingBalance} coins remaining`);
  }

  /**
   * Get page configuration for a specific route
   */
  getRouteConfig(route: string): PageVisitConfig | null {
    return this.getPageConfig(route);
  }

  /**
   * Update page configurations (for admin use)
   */
  updatePageConfigs(configs: PageVisitConfig[]): void {
    this.pageConfigs = configs;
  }

  /**
   * Get all page configurations
   */
  getPageConfigs(): PageVisitConfig[] {
    return [...this.pageConfigs];
  }

  /**
   * Manually trigger a page visit (for testing)
   */
  triggerPageVisit(route: string): void {
    this.handleRouteChange(route);
  }
}