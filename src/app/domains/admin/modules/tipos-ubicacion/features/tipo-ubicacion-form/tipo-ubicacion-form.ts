import { HttpErrorResponse } from '@angular/common/http';
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { TiposUbicacionService } from '../../services/tipos-ubicacion.service';
import { TipoUbicacionCreate } from '../../types/tipo-ubicacion.types';

@Component({
  selector: 'app-tipo-ubicacion-form',
  templateUrl: './tipo-ubicacion-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class TipoUbicacionForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(TiposUbicacionService);

  protected empresaContexto = inject(EmpresaContextoService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;

  protected loading = signal(false);
  protected guardando = signal(false);
  protected detalleCargado = signal(false);
  protected errorMessage = signal<string | null>(null);

  // ==========================================
  // FORMULARIO
  // ==========================================

  protected form = this.fb.nonNullable.group({
    clave: [
      '',
      [
        Validators.required,
        Validators.maxLength(50),
      ],
    ],

    nombre: [
      '',
      [
        Validators.required,
        Validators.maxLength(150),
      ],
    ],

    descripcion: [
      '',
      Validators.maxLength(500),
    ],
  });

  // ==========================================
  // CARGA INICIAL
  // ==========================================

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.form.reset();
      this.errorMessage.set(null);

      this.detalleCargado.set(
        !!empresaId && !this.esEdicion
      );

      this.loading.set(
        !!empresaId && this.esEdicion
      );

      if (!empresaId || !this.id) {
        return;
      }

      const subscription = this.service.getById(this.id).subscribe({
        next: tipo => {
          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.form.patchValue({
            clave: tipo.clave,
            nombre: tipo.nombre,
            descripcion: tipo.descripcion ?? '',
          });

          this.detalleCargado.set(true);
          this.loading.set(false);
        },

        error: () => {
          this.errorMessage.set(
            'No fue posible cargar el tipo de ubicación.'
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  // ==========================================
  // GUARDAR
  // ==========================================

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.detalleCargado()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      this.errorMessage.set(
        'Debes seleccionar una empresa.'
      );
      return;
    }

    const value = this.form.getRawValue();

    if (!value.clave.trim() || !value.nombre.trim()) {
      this.errorMessage.set(
        'La clave y el nombre son obligatorios.'
      );
      return;
    }

    const dto: TipoUbicacionCreate = {
      clave: value.clave.trim().toUpperCase(),
      nombre: value.nombre.trim(),
      descripcion: this.nullIfEmpty(value.descripcion),
    };

    this.guardando.set(true);
    this.errorMessage.set(null);

    try {
      if (this.esEdicion && this.id) {
        await firstValueFrom(
          this.service.update(this.id, dto)
        );
      } else {
        await firstValueFrom(
          this.service.create(dto)
        );
      }

      if (this.empresaContexto.empresaId === empresaId) {
        await this.router.navigate([
          '/admin/tipos-ubicacion',
        ]);
      }
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(
          this.getErrorMessage(error)
        );
      }
    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // CANCELAR
  // ==========================================

  protected cancelar(): void {
    void this.router.navigate([
      '/admin/tipos-ubicacion',
    ]);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private nullIfEmpty(value: string): string | null {
    return value.trim() || null;
  }

  private getErrorMessage(error: unknown): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return 'No fue posible guardar el tipo de ubicación.';
  }
}