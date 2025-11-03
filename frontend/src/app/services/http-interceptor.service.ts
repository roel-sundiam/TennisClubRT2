import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  console.log('🔧 HTTP Interceptor - Token:', !!token);

  // Check if token is expired before sending request
  if (token && authService.isTokenExpired()) {
    console.log('🔒 HTTP Interceptor - Token expired before request, triggering auto-logout');
    authService.logout();

    // Return 401 error locally without making the request
    return throwError(() => new HttpErrorResponse({
      error: { success: false, message: 'Token expired' },
      status: 401,
      statusText: 'Unauthorized',
      url: req.url
    }));
  }

  // Clone request and add Authorization header if token exists
  const authReq = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      })
    : req;

  if (token) {
    console.log('🔧 HTTP Interceptor - Added Authorization header');
  } else {
    console.log('🔧 HTTP Interceptor - No token, proceeding without auth');
  }

  // Handle the request and catch 401 errors from backend
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized error from backend, auto-logout
      if (error.status === 401) {
        console.log('🔒 HTTP Interceptor - 401 Unauthorized from backend, triggering auto-logout');
        authService.logout();
      }
      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
};