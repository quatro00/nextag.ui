import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';

import { CategoriasTicketService } from
  '../../services/categorias-ticket.service';

import { mensajeApi } from '../../../shared/api-error';

@Component({
  selector: 'app-categoria-ticket-form',
  templateUrl: './categoria-ticket-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class CategoriaTicketForm {

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CategoriasTicketService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly empresa = inject(EmpresaContextoService);

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly id =
    this.route.snapshot.paramMap.get('id');

  protected readonly esEdicion = !!this.id;

  protected readonly form = this.fb.nonNullable.group({
    clave: ['', [
      Validators.required,
      Validators.maxLength(40),
    ]],
    nombre: ['', [
      Validators.required,
      Validators.maxLength(150),
    ]],
    descripcion: ['', Validators.maxLength(500)],
  });

  constructor() {
    effect(() => {
      const empresaId = this.empresa.seleccionada()?.id ?? null;

      this.form.reset();
      this.error.set(null);

      if (empresaId && this.id) {
        void this.cargar();
      }
    });
  }

  private async cargar(): Promise<void> {
    if (!this.id) return;

    const empresaId = this.empresa.empresaId;
    if (!empresaId) return;

    this.cargando.set(true);

    try {
      const dto = await firstValueFrom(
        this.service.getById(this.id)
      );

      if (this.empresa.empresaId !== empresaId) return;

      this.form.patchValue({
        clave: dto.clave,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? '',
      });

    } catch (err) {
      this.error.set(
        mensajeApi(err, 'No fue posible cargar la categoría.')
      );
    } finally {
      this.cargando.set(false);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.empresa.empresaId) return;

    const valores = this.form.getRawValue();

    const dto = {
      clave: valores.clave.trim(),
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
    };

    if (!dto.clave || !dto.nombre) {
      this.error.set('La clave y el nombre son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {
      if (this.id) {
        await firstValueFrom(
          this.service.update(this.id, dto)
        );
      } else {
        await firstValueFrom(
          this.service.create(dto)
        );
      }

      await this.router.navigate([
        '/admin/categorias-ticket',
      ]);

    } catch (err) {
      this.error.set(
        mensajeApi(err, 'No fue posible guardar la categoría.')
      );
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate([
      '/admin/categorias-ticket',
    ]);
  }
}