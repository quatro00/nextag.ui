import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@/app/domains/auth/services/auth.services';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const roles = route.data?.['roles'] as string[] | undefined;

  if (!roles?.length) {
    return true;
  }

  if (authService.hasAnyRole(roles)) {
    return true;
  }

  return router.createUrlTree(['/admin/inicio']);
};