import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AreasService } from '../../../areas/services/areas.services';
import { AreaList } from '../../../areas/types/area.types';
import { DepartamentosService } from '../../services/departamentos.services';
import {
  DepartamentoCreate,
  DepartamentoUpdate,
} from '../../types/departamento.types';

@Component({
  selector: 'app-departamento-form',
  templateUrl: './departamento-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
})
export default class DepartamentoForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(DepartamentosService);
  private areasService = inject(AreasService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected areas = signal<AreaList[]>([]);

  protected form = this.fb.nonNullable.group({
    areaId: ['', Validators.required],
    clave: ['', [Validators.required, Validators.maxLength(30)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    void this.inicializar();
  }

  private async inicializar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.areas.set(
        await firstValueFrom(this.areasService.getAll())
      );

      if (this.esEdicion && this.id)
        await this.cargar(this.id);

    } catch {
      this.errorMessage.set('No fue posible cargar la información del departamento.');
    } finally {
      this.loading.set(false);
    }
  }

  private async cargar(id: string): Promise<void> {
    const departamento = await firstValueFrom(
      this.service.getById(id)
    );

    this.form.patchValue({
      areaId: departamento.areaId,
      clave: departamento.clave,
      nombre: departamento.nombre,
      descripcion: departamento.descripcion ?? '',
    });
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

        const dto: DepartamentoUpdate = {
          areaId: value.areaId,
          clave: value.clave.trim(),
          nombre: value.nombre.trim(),
          descripcion: this.nullIfEmpty(value.descripcion),
        };

        await firstValueFrom(
          this.service.update(this.id, dto)
        );

      } else {

        const dto: DepartamentoCreate = {
          areaId: value.areaId,
          clave: value.clave.trim(),
          nombre: value.nombre.trim(),
          descripcion: this.nullIfEmpty(value.descripcion),
        };

        await firstValueFrom(
          this.service.create(dto)
        );
      }

      await this.router.navigate(['/admin/departamentos']);

    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/departamentos']);
  }

  private nullIfEmpty(value: string): string | null {
    const result = value.trim();
    return result ? result : null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse)
      return error.error?.message ??
        'No fue posible guardar el departamento.';

    return 'No fue posible guardar el departamento.';
  }
}