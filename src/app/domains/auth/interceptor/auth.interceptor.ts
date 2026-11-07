import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AuthService } from '@/app/domains/auth/services/auth.services';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const apiUrl = inject(API_URL);
  const empresaContexto = inject(EmpresaContextoService);

  const isApiRequest = req.url.startsWith(apiUrl);
  const isPublicRequest = req.url.startsWith(`${apiUrl}/publico/`);
  const token = authService.accessToken;

  let request = req;

  if (isPublicRequest) {
    return next(req);
  }

  if (isApiRequest && token && !authService.isTokenExpired()) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const empresaId = empresaContexto.empresaId;

    if (empresaId) {
      headers['X-Empresa-Id'] = empresaId;
    }

    request = req.clone({ setHeaders: headers });
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