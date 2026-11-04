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
import { SucursalesService } from '../../services/sucursales.service';
import { SucursalCreate } from '../../types/sucursal.types';

@Component({
  selector: 'app-sucursal-form',
  templateUrl: './sucursal-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class SucursalForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(SucursalesService);

  protected empresaContexto = inject(EmpresaContextoService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;

  protected loading = signal(false);
  protected guardando = signal(false);
  protected detalleCargado = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: ['', Validators.maxLength(500)],

    direccion: ['', Validators.maxLength(300)],
    colonia: ['', Validators.maxLength(150)],
    municipio: ['', Validators.maxLength(150)],
    estado: ['', Validators.maxLength(150)],
    codigoPostal: ['', Validators.maxLength(15)],
    pais: ['', Validators.maxLength(100)],

    telefono: ['', Validators.maxLength(30)],
    correo: ['', [Validators.email, Validators.maxLength(256)]],
  });

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.form.reset();
      this.errorMessage.set(null);
      this.detalleCargado.set(!!empresaId && !this.esEdicion);
      this.loading.set(!!empresaId && this.esEdicion);

      if (!empresaId || !this.id) return;

      const subscription = this.service.getById(this.id).subscribe({
        next: sucursal => {
          if (this.empresaContexto.empresaId !== empresaId) return;

          this.form.patchValue({
            clave: sucursal.clave,
            nombre: sucursal.nombre,
            descripcion: sucursal.descripcion ?? '',

            direccion: sucursal.direccion ?? '',
            colonia: sucursal.colonia ?? '',
            municipio: sucursal.municipio ?? '',
            estado: sucursal.estado ?? '',
            codigoPostal: sucursal.codigoPostal ?? '',
            pais: sucursal.pais ?? '',

            telefono: sucursal.telefono ?? '',
            correo: sucursal.correo ?? '',
          });

          this.detalleCargado.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('No fue posible cargar la sucursal.');
          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected async guardar(): Promise<void> {
    if (
      this.guardando() ||
      !this.detalleCargado() ||
      this.form.invalid
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      this.errorMessage.set('Debes seleccionar una empresa.');
      return;
    }

    const value = this.form.getRawValue();

    if (!value.clave.trim() || !value.nombre.trim()) {
      this.errorMessage.set('La clave y el nombre son obligatorios.');
      return;
    }

    const dto: SucursalCreate = {
      clave: value.clave.trim().toUpperCase(),
      nombre: value.nombre.trim(),
      descripcion: this.nullIfEmpty(value.descripcion),

      direccion: this.nullIfEmpty(value.direccion),
      colonia: this.nullIfEmpty(value.colonia),
      municipio: this.nullIfEmpty(value.municipio),
      estado: this.nullIfEmpty(value.estado),
      codigoPostal: this.nullIfEmpty(value.codigoPostal),
      pais: this.nullIfEmpty(value.pais),

      telefono: this.nullIfEmpty(value.telefono),
      correo: this.nullIfEmpty(value.correo),
    };

    this.guardando.set(true);
    this.errorMessage.set(null);

    try {
      if (this.esEdicion && this.id) {
        await firstValueFrom(this.service.update(this.id, dto));
      } else {
        await firstValueFrom(this.service.create(dto));
      }

      if (this.empresaContexto.empresaId === empresaId) {
        await this.router.navigate(['/admin/sucursales']);
      }
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.getErrorMessage(error));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/sucursales']);
  }

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

    return 'No fue posible guardar la sucursal.';
  }
}