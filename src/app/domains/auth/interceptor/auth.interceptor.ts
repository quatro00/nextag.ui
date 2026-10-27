import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { AuthService } from '@/app/domains/auth/services/auth.services';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const apiUrl = inject(API_URL);

  const isApiRequest = req.url.startsWith(apiUrl);
  const token = authService.accessToken;

  let request = req;

  if (
    isApiRequest &&
    token &&
    !authService.isTokenExpired()
  ) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest && error.status === 401) {
        authService.logout();

        if (router.url !== '/auth/sign-in') {
          void router.navigateByUrl('/auth/sign-in');
        }
      }

      return throwError(() => error);
    })
  );
};