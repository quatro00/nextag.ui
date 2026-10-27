import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AreasService } from '../../services/areas.services';
import { AreaCreate, AreaUpdate } from '../../types/area.types';

@Component({
  selector: 'app-area-form',
  templateUrl: './area-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class AreaForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(AreasService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(30)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    if (this.esEdicion) void this.cargar();
  }

  private async cargar(): Promise<void> {
    if (!this.id) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const area = await firstValueFrom(this.service.getById(this.id));

      this.form.patchValue({
        clave: area.clave,
        nombre: area.nombre,
        descripcion: area.descripcion ?? '',
      });
    } catch {
      this.errorMessage.set('No fue posible cargar el área.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const value = this.form.getRawValue();

      if (this.esEdicion && this.id) {
        const dto: AreaUpdate = {
          clave: value.clave.trim(),
          nombre: value.nombre.trim(),
          descripcion: this.nullIfEmpty(value.descripcion),
        };

        await firstValueFrom(this.service.update(this.id, dto));
      } else {
        const dto: AreaCreate = {
          clave: value.clave.trim(),
          nombre: value.nombre.trim(),
          descripcion: this.nullIfEmpty(value.descripcion),
        };

        await firstValueFrom(this.service.create(dto));
      }

      await this.router.navigate(['/admin/areas']);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/areas']);
  }

  private nullIfEmpty(value: string): string | null {
    const result = value.trim();
    return result ? result : null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse)
      return error.error?.message ?? 'No fue posible guardar el área.';

    return 'No fue posible guardar el área.';
  }
}