import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Navigation } from '@/app/domains/admin/layout/ui/navigation';

@Component({
  selector: 'admin-sidebar',
  imports: [Navigation, MatIcon],
  host: { class: 'flex w-full flex-auto flex-col' },
  template: `
    <div class="flex items-center gap-x-3 px-6 pt-6">
      <div class="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary">
        <mat-icon class="size-5" svgIcon="blocks" />
      </div>
      <div class="min-w-0">
        <div class="truncate text-lg font-bold leading-none">Aplicación</div>
        <div class="mt-1 text-xs text-on-surface-variant">Base reutilizable</div>
      </div>
    </div>
    <navigation class="mt-8 mb-4 flex-auto" />
  `,
})
export class AdminSidebar {}
