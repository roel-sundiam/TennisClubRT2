import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'member' | 'admin' | 'superadmin';
  coinBalance: number;
  seedPoints?: number;
  matchesWon?: number;
  matchesPlayed?: number;
  phone?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(true);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check for existing token on service initialization
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    if (token && userString && userString !== 'undefined' && userString !== 'null') {
      try {
        const user = JSON.parse(userString);

        // Check if token is expired
        if (tokenExpiration && this.isTokenExpiredByTimestamp(Number(tokenExpiration))) {
          console.log('🔐 Token expired during initialization, clearing auth state');
          this.clearAuthState();
        } else {
          this.tokenSubject.next(token);
          this.currentUserSubject.next(user);
          console.log('🔐 Restored auth state from localStorage:', user.username);
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        // Clear invalid data
        this.clearAuthState();
      }
    }

    // Set loading to false after initialization
    setTimeout(() => {
      this.isLoadingSubject.next(false);
      console.log('✅ Auth service initialization complete');
    }, 0);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response: any) => {
          console.log('Login response:', response); // Debug log
          // Backend returns: { success: true, data: { token, user, expiresIn }, message }
          const token = response.data?.token || response.token;
          const user = response.data?.user || response.user;
          const expiresIn = response.data?.expiresIn || response.expiresIn || '7d';

          if (token && user) {
            // Calculate and store token expiration timestamp
            const expirationTimestamp = this.calculateExpirationTimestamp(expiresIn);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('tokenExpiration', expirationTimestamp.toString());

            this.tokenSubject.next(token);
            this.currentUserSubject.next(user);

            console.log('Auth state updated - token:', !!token, 'user:', user.username, 'expires:', new Date(expirationTimestamp).toLocaleString());
          } else {
            console.error('Invalid login response - missing token or user');
          }
          this.isLoadingSubject.next(false);
        })
      );
  }

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  /**
   * Clear all authentication state from localStorage and subjects
   */
  private clearAuthState(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isLoadingSubject.next(false);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    if (!this.token) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('🔐 Token expired, logging out');
      this.logout();
      return false;
    }

    return true;
  }

  isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'superadmin';
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'superadmin';
  }

  /**
   * Update the coin balance in the current user state
   */
  updateCoinBalance(newBalance: number): void {
    const currentUser = this.currentUser;
    if (currentUser && currentUser.coinBalance !== newBalance) { // Only update if balance actually changed
      const updatedUser = { ...currentUser, coinBalance: newBalance };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  /**
   * Get current user's coin balance
   */
  getCoinBalance(): number {
    return this.currentUser?.coinBalance || 0;
  }

  /**
   * Get user profile from server
   */
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`);
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, profileData)
      .pipe(
        tap((response: any) => {
          // Update local user data if response contains updated user
          if (response.data?.user) {
            const updatedUser = response.data.user;
            this.currentUserSubject.next(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        })
      );
  }

  /**
   * Change user password
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/change-password`, passwordData);
  }

  /**
   * Check if the current token is expired
   */
  isTokenExpired(): boolean {
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    if (!tokenExpiration) {
      return false; // No expiration set, assume valid (for backwards compatibility)
    }

    return this.isTokenExpiredByTimestamp(Number(tokenExpiration));
  }

  /**
   * Check if a given timestamp is in the past (token expired)
   */
  private isTokenExpiredByTimestamp(expirationTimestamp: number): boolean {
    return Date.now() >= expirationTimestamp;
  }

  /**
   * Calculate expiration timestamp from expiresIn string (e.g., "7d", "24h", "60m")
   */
  private calculateExpirationTimestamp(expiresIn: string): number {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([dhms])$/);

    if (!match) {
      console.warn('Invalid expiresIn format:', expiresIn, '- defaulting to 7 days');
      return now + (7 * 24 * 60 * 60 * 1000); // Default to 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    let milliseconds = 0;
    switch (unit) {
      case 'd': // days
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'h': // hours
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'm': // minutes
        milliseconds = value * 60 * 1000;
        break;
      case 's': // seconds
        milliseconds = value * 1000;
        break;
      default:
        milliseconds = 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }

    return now + milliseconds;
  }
}