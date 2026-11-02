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
import { EmpresasService } from '../../services/empresas.service';
import { EmpresaCreate } from '../../types/empresa.types';

@Component({
  selector: 'app-empresa-form',
  templateUrl: './empresa-form.html',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
})
export default class EmpresaForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EmpresasService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;
  protected loading = signal(false);
  protected guardando = signal(false);
  protected detalleCargado = signal(!this.id);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    razonSocial: ['', Validators.maxLength(250)],
    rfc: ['', Validators.maxLength(20)],
    correo: ['', [Validators.email, Validators.maxLength(256)]],
    telefono: ['', Validators.maxLength(30)],
    sitioWeb: ['', Validators.maxLength(250)],
    logoUrl: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    if (this.esEdicion) void this.cargar();
  }

  private async cargar(): Promise<void> {
    if (!this.id) return;
    this.loading.set(true);
    this.detalleCargado.set(false);
    this.errorMessage.set(null);

    try {
      const empresa = await firstValueFrom(this.service.getById(this.id));
      this.form.patchValue({
        clave: empresa.clave,
        nombre: empresa.nombre,
        razonSocial: empresa.razonSocial ?? '',
        rfc: empresa.rfc ?? '',
        correo: empresa.correo ?? '',
        telefono: empresa.telefono ?? '',
        sitioWeb: empresa.sitioWeb ?? '',
        logoUrl: empresa.logoUrl ?? '',
      });
      this.detalleCargado.set(true);
    } catch {
      this.errorMessage.set('No fue posible cargar la empresa.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.detalleCargado()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (!value.clave.trim() || !value.nombre.trim()) {
      this.errorMessage.set('La clave y el nombre son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.errorMessage.set(null);
    try {
      const dto: EmpresaCreate = {
        clave: value.clave.trim().toUpperCase(),
        nombre: value.nombre.trim(),
        razonSocial: this.nullIfEmpty(value.razonSocial),
        rfc: this.nullIfEmpty(value.rfc)?.toUpperCase() ?? null,
        correo: this.nullIfEmpty(value.correo),
        telefono: this.nullIfEmpty(value.telefono),
        sitioWeb: this.nullIfEmpty(value.sitioWeb),
        logoUrl: this.nullIfEmpty(value.logoUrl),
      };

      if (this.esEdicion && this.id) {
        await firstValueFrom(this.service.update(this.id, dto));
      } else {
        await firstValueFrom(this.service.create(dto));
      }
      await this.router.navigate(['/admin/empresas']);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/empresas']);
  }

  private nullIfEmpty(value: string): string | null {
    const result = value.trim();
    return result || null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'No fue posible guardar la empresa.';
  }
}