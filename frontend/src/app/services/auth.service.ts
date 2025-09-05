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

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check for existing token on service initialization
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (token && userString && userString !== 'undefined' && userString !== 'null') {
      try {
        const user = JSON.parse(userString);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response: any) => {
          console.log('Login response:', response); // Debug log
          // Backend returns: { success: true, data: { token, user }, message }
          const token = response.data?.token || response.token;
          const user = response.data?.user || response.user;
          
          if (token && user) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            this.tokenSubject.next(token);
            this.currentUserSubject.next(user);
            console.log('Auth state updated - token:', !!token, 'user:', user.username);
          } else {
            console.error('Invalid login response - missing token or user');
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.token;
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
}