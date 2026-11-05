import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { MarcasService } from '../../services/marcas.service';
import { MarcaCreate } from '../../types/marca.types';

@Component({
  selector: 'app-marca-form',
  templateUrl: './marca-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class MarcaForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MarcasService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly esEdicion = !!this.id;
  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);
  protected readonly detalleCargado = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      this.form.reset();
      this.errorMessage.set(null);
      this.detalleCargado.set(!!empresaId && !this.esEdicion);
      this.loading.set(!!empresaId && this.esEdicion);
      if (!empresaId || !this.id) return;

      const sub = this.service.getById(this.id).subscribe({
        next: marca => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.form.patchValue({
            clave: marca.clave,
            nombre: marca.nombre,
            descripcion: marca.descripcion ?? '',
          });
          this.detalleCargado.set(true);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar la marca.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.detalleCargado()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) {
      this.errorMessage.set('Debes seleccionar una empresa.');
      return;
    }

    const datos = this.form.getRawValue();
    if (!datos.clave.trim() || !datos.nombre.trim()) {
      this.errorMessage.set('La clave y el nombre son obligatorios.');
      return;
    }

    const dto: MarcaCreate = {
      clave: datos.clave.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim() || null,
    };

    this.guardando.set(true);
    this.errorMessage.set(null);
    try {
      if (this.id) await firstValueFrom(this.service.update(this.id, dto));
      else await firstValueFrom(this.service.create(dto));
      if (this.empresaContexto.empresaId === empresaId) {
        await this.router.navigate(['/admin/marcas']);
      }
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible guardar la marca.'));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/marcas']);
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
