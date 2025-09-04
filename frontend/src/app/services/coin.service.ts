import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CoinTransaction {
  _id: string;
  userId: string | { _id: string; username: string; fullName: string; email: string };
  type: 'earned' | 'spent' | 'purchased' | 'refunded' | 'bonus' | 'penalty';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: any;
  status?: 'pending' | 'completed' | 'failed';
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoinBalance {
  balance: number;
  isLowBalance: boolean;
  lowBalanceThreshold: number;
  recentTransactions: CoinTransaction[];
}

export interface CoinStats {
  totalTransactions: number;
  totalCoinsAwarded: number;
  totalCoinsSpent: number;
  totalCoinsPurchased: number;
  totalCoinsRefunded: number;
  netCoinsInCirculation: number;
  balanceDistribution: Array<{
    _id: string;
    count: number;
    totalCoins: number;
  }>;
  totalStats: {
    totalUsers: number;
    totalCoinsInCirculation: number;
    averageBalance: number;
    usersWithCoins: number;
  };
}

export interface PurchaseCoinsRequest {
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'gcash';
  paymentReference?: string;
}

export interface AdminCoinAction {
  userId: string;
  amount: number;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private apiUrl = environment.apiUrl;
  private coinBalanceSubject = new BehaviorSubject<number>(0);
  
  public coinBalance$ = this.coinBalanceSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current user's coin balance and recent transactions
   */
  getCoinBalance(): Observable<{ success: boolean; data: CoinBalance }> {
    return this.http.get<{ success: boolean; data: CoinBalance }>(`${this.apiUrl}/coins/balance`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.coinBalanceSubject.next(response.data.balance);
          }
        })
      );
  }

  /**
   * Get paginated coin transaction history
   */
  getCoinTransactions(page = 1, limit = 10, type?: string): Observable<{
    success: boolean;
    data: CoinTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (type) params.type = type;

    return this.http.get<any>(`${this.apiUrl}/coins/transactions`, { params });
  }

  /**
   * Purchase coins (creates a request that needs external payment)
   */
  purchaseCoins(request: PurchaseCoinsRequest): Observable<{
    success: boolean;
    data: CoinTransaction;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/coins/purchase`, request)
      .pipe(
        tap(response => {
          if (response.success) {
            // Refresh balance after successful purchase
            this.refreshBalance();
          }
        })
      );
  }

  /**
   * Use coins to pay for a reservation
   */
  useCoinsForPayment(paymentId: string): Observable<{
    success: boolean;
    data: {
      coinTransaction: CoinTransaction;
      payment: any;
      remainingBalance: number;
    };
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/coins/use-for-payment`, { paymentId })
      .pipe(
        tap(response => {
          if (response.success) {
            this.coinBalanceSubject.next(response.data.remainingBalance);
          }
        })
      );
  }

  /**
   * Award coins to a user (admin only)
   */
  awardCoins(request: AdminCoinAction): Observable<{
    success: boolean;
    data: CoinTransaction;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/coins/award`, request);
  }

  /**
   * Deduct coins from a user (admin only)
   */
  deductCoins(request: AdminCoinAction): Observable<{
    success: boolean;
    data: CoinTransaction;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/coins/deduct`, request);
  }

  /**
   * Get coin system statistics (admin only)
   */
  getCoinStats(startDate?: string, endDate?: string): Observable<{
    success: boolean;
    data: CoinStats;
  }> {
    let params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<any>(`${this.apiUrl}/coins/stats`, { params });
  }

  /**
   * Reverse a coin transaction (admin only)
   */
  reverseTransaction(transactionId: string, reason: string): Observable<{
    success: boolean;
    data: CoinTransaction;
    message: string;
  }> {
    return this.http.put<any>(`${this.apiUrl}/coins/transactions/${transactionId}/reverse`, { reason });
  }

  /**
   * Update coin balance in service state
   */
  updateBalance(newBalance: number): void {
    if (this.coinBalanceSubject.value !== newBalance) { // Only emit if balance actually changed
      this.coinBalanceSubject.next(newBalance);
    }
  }

  /**
   * Refresh coin balance from server
   */
  refreshBalance(): void {
    this.getCoinBalance().subscribe({
      next: (response) => {
        if (response.success) {
          this.coinBalanceSubject.next(response.data.balance);
        }
      },
      error: (error) => {
        console.error('Error refreshing coin balance:', error);
      }
    });
  }

  /**
   * Get current balance value (synchronous)
   */
  getCurrentBalance(): number {
    return this.coinBalanceSubject.value;
  }

  /**
   * Get pending coin purchases (admin only)
   */
  getPendingPurchases(): Observable<{
    success: boolean;
    data: CoinTransaction[];
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/coins/purchases/pending`);
  }

  /**
   * Approve coin purchase (admin only)
   */
  approveCoinPurchase(transactionId: string, approvalNote?: string): Observable<{
    success: boolean;
    data: CoinTransaction;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/coins/purchases/${transactionId}/approve`, {
      approvalNote
    });
  }

  /**
   * Reject coin purchase (admin only)
   */
  rejectCoinPurchase(transactionId: string, rejectionReason?: string): Observable<{
    success: boolean;
    data: CoinTransaction;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/coins/purchases/${transactionId}/reject`, {
      rejectionReason
    });
  }
}