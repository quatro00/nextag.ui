import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="mx-auto flex w-full max-w-7xl flex-auto flex-col p-6 sm:p-8">
      <div class="rounded-2xl border bg-surface p-6 sm:p-8">
        <div class="text-3xl font-bold tracking-tight">Aplicación base</div>
        <div class="mt-2 max-w-2xl text-on-surface-variant">
          Este proyecto quedó limpio y listo para agregar módulos, servicios, guards, modelos y componentes propios.
        </div>
      </div>
    </div>
  `,
})
export default class Home {}
