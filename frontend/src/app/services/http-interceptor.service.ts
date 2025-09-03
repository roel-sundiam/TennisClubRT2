import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;
  
  console.log('🔧 HTTP Interceptor - Token:', !!token);
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    console.log('🔧 HTTP Interceptor - Added Authorization header');
    return next(authReq);
  }
  
  console.log('🔧 HTTP Interceptor - No token, proceeding without auth');
  return next(req);
};