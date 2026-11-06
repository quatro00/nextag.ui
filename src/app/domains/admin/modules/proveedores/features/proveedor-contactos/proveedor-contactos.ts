import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { ProveedorContactosService } from '../../services/proveedor-contactos.service';
import { ProveedorContacto, ProveedorContactoGuardar } from '../../types/proveedor-contacto.types';

@Component({
  selector: 'app-proveedor-contactos',
  templateUrl: './proveedor-contactos.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class ProveedorContactos {
  readonly proveedorId = input.required<string>();
  readonly proveedorActivo = input(true);
  readonly puedeGestionar = input(false);

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProveedorContactosService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly contactos = signal<ProveedorContacto[]>([]);
  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);
  protected readonly actualizandoId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mostrarFormulario = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly editandoActivo = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    cargo: ['', Validators.maxLength(150)],
    correo: ['', [Validators.email, Validators.maxLength(256)]],
    telefono: ['', Validators.maxLength(30)],
    celular: ['', Validators.maxLength(30)],
    esPrincipal: [false],
  });

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      const proveedorId = this.proveedorId();
      this.contactos.set([]);
      this.form.reset();
      this.mostrarFormulario.set(false);
      this.editandoId.set(null);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.loading.set(!!empresaId && !!proveedorId);
      if (!empresaId || !proveedorId) return;

      const sub = this.service.getAll(proveedorId).subscribe({
        next: items => {
          if (this.empresaContexto.empresaId !== empresaId || this.proveedorId() !== proveedorId) return;
          this.contactos.set(items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId || this.proveedorId() !== proveedorId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar los contactos.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected nuevo(): void {
    if (!this.puedeGestionar() || !this.proveedorActivo() || this.guardando()) return;
    this.form.reset();
    this.editandoId.set(null);
    this.editandoActivo.set(true);
    this.mostrarFormulario.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected editar(contacto: ProveedorContacto): void {
    if (!this.puedeGestionar() || !this.proveedorActivo() || this.guardando()) return;
    this.form.reset();
    this.form.patchValue({
      nombre: contacto.nombre,
      cargo: contacto.cargo ?? '',
      correo: contacto.correo ?? '',
      telefono: contacto.telefono ?? '',
      celular: contacto.celular ?? '',
      esPrincipal: contacto.esPrincipal,
    });
    this.editandoId.set(contacto.id);
    this.editandoActivo.set(contacto.activo);
    this.mostrarFormulario.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected cancelarFormulario(): void {
    if (this.guardando()) return;
    this.mostrarFormulario.set(false);
    this.editandoId.set(null);
    this.form.reset();
  }

  protected async guardar(): Promise<void> {
    if (!this.puedeGestionar() || !this.proveedorActivo() || !this.mostrarFormulario() || this.guardando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const empresaId = this.empresaContexto.empresaId;
    const proveedorId = this.proveedorId();
    if (!empresaId || !proveedorId) return;
    const valores = this.form.getRawValue();
    if (!valores.nombre.trim()) {
      this.errorMessage.set('El nombre del contacto es obligatorio.');
      return;
    }
    if (valores.esPrincipal && !this.editandoActivo()) {
      this.errorMessage.set('Activa el contacto antes de establecerlo como principal.');
      return;
    }

    const dto: ProveedorContactoGuardar = {
      nombre: valores.nombre.trim(),
      cargo: this.nullIfEmpty(valores.cargo),
      correo: this.nullIfEmpty(valores.correo),
      telefono: this.nullIfEmpty(valores.telefono),
      celular: this.nullIfEmpty(valores.celular),
      esPrincipal: valores.esPrincipal,
    };

    this.guardando.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const editandoId = this.editandoId();
      if (editandoId) {
        await firstValueFrom(this.service.update(proveedorId, editandoId, dto));
      } else {
        await firstValueFrom(this.service.create(proveedorId, dto));
      }
      if (this.empresaContexto.empresaId !== empresaId || this.proveedorId() !== proveedorId) return;
      const items = await firstValueFrom(this.service.getAll(proveedorId));
      if (this.empresaContexto.empresaId !== empresaId || this.proveedorId() !== proveedorId) return;
      this.contactos.set(items);
      this.mostrarFormulario.set(false);
      this.editandoId.set(null);
      this.form.reset();
      this.successMessage.set('Contacto guardado correctamente.');
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId && this.proveedorId() === proveedorId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible guardar el contacto.'));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected async cambiarEstatus(contacto: ProveedorContacto): Promise<void> {
    if (!this.puedeGestionar() || !this.proveedorActivo() || this.actualizandoId() !== null || this.guardando()) return;
    const empresaId = this.empresaContexto.empresaId;
    const proveedorId = this.proveedorId();
    if (!empresaId || !proveedorId) return;
    const activo = !contacto.activo;
    if (!confirm(`¿Deseas ${activo ? 'activar' : 'desactivar'} el contacto "${contacto.nombre}"?`)) return;

    this.actualizandoId.set(contacto.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await firstValueFrom(this.service.updateStatus(proveedorId, contacto.id, activo));
      if (this.empresaContexto.empresaId !== empresaId || this.proveedorId() !== proveedorId) return;
      const items = await firstValueFrom(this.service.getAll(proveedorId));
      if (this.empresaContexto.empresaId !== empresaId || this.proveedorId() !== proveedorId) return;
      this.contactos.set(items);
      // Evita editar datos desactualizados después de desactivar un contacto.
      if (this.editandoId() === contacto.id) this.cancelarFormulario();
      this.successMessage.set('Estatus del contacto actualizado.');
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId && this.proveedorId() === proveedorId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible actualizar el contacto.'));
      }
    } finally {
      if (this.actualizandoId() === contacto.id) this.actualizandoId.set(null);
    }
  }

  private nullIfEmpty(valor: string): string | null {
    return valor.trim() || null;
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
