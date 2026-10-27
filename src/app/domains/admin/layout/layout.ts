import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterOutlet } from '@angular/router';
import { Media } from '@/app/core/media';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { SchemeSwitcher } from './ui/scheme-switcher';
import { AdminSidebar } from './ui/sidebar';


@Component({
  selector: 'admin-layout',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterOutlet,
    MatSidenavContainer,
    MatTooltipModule,
    MatSidenav,
    MatSidenavContent,
    AdminSidebar,
    SchemeSwitcher,
  ],
  template: `
    <mat-sidenav-container>
      <mat-sidenav
        class="w-70 border-r border-neutral-200 scheme-dark dark:border-neutral-800 dark:bg-neutral-900 print:hidden"
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        [disableClose]="!isMobile()"
        fixedInViewport
        #sidenav="matSidenav"
      >
        <admin-sidebar />
      </mat-sidenav>

      <mat-sidenav-content
        class="flex flex-col lg:h-dvh lg:overflow-hidden print:ml-0! print:h-auto print:overflow-visible"
      >
        <div class="flex h-16 items-center border-b px-4 print:hidden">
          <button matIconButton (click)="sidenav.toggle()">
            <mat-icon svgIcon="panel-left" />
          </button>

          <div class="mx-3 h-5 border-l"></div>

          <div class="font-semibold">NEXTAG</div>

          <div class="flex-auto"></div>

          <scheme-switcher />

          <div class="mx-3 h-6 border-l"></div>

        

          <button
            matIconButton
            [matMenuTriggerFor]="userMenu"
            matTooltip="Cuenta"
          >
            <mat-icon svgIcon="circle-user-round" />
          </button>

          <mat-menu #userMenu>
            <div class="min-w-64 px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
                >
                  {{ iniciales() }}
                </div>

                <div class="min-w-0">
                  <div class="truncate font-semibold">
                    {{ authService.user()?.name }}
                  </div>

                  <div class="truncate text-xs text-on-surface-variant">
                    {{ authService.user()?.email }}
                  </div>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-1">
                @for (rol of authService.user()?.roles ?? []; track rol) {
                  <span
                    class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {{ rol }}
                  </span>
                }
              </div>
            </div>

            <div class="my-1 border-t"></div>

            <button mat-menu-item (click)="logout()">
              <mat-icon svgIcon="log-out" />
              <span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </div>

        <div
          class="flex flex-col lg:min-h-0 lg:flex-auto lg:overflow-auto print:overflow-visible"
        >
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class AdminLayout {
  private media = inject(Media);
  private router = inject(Router);

  protected authService = inject(AuthService);

  protected isMobile = computed(() =>
    this.media.match('(max-width: 1023px)')()
  );

  protected iniciales = computed(() => {
    const name = this.authService.user()?.name?.trim();

    if (!name) {
      return 'U';
    }

    const parts = name.split(/\s+/);

    return parts
      .slice(0, 2)
      .map(x => x.charAt(0).toUpperCase())
      .join('');
  });

  protected logout(): void {
    this.authService.logout();

    void this.router.navigateByUrl('/auth/sign-in');
  }
}