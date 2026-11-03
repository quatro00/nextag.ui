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
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { EmpresasService } from '../../../empresas/services/empresas.service';
import { EmpresaList } from '../../../empresas/types/empresa.types';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioCreate, UsuarioUpdate } from '../../types/usuario.types';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.html',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
})
export default class UsuarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosService);
  private empresasService = inject(EmpresasService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;
  protected loading = signal(false);
  protected guardando = signal(false);
  protected cargado = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected empresas = signal<EmpresaList[]>([]);
  protected rolesDisponibles = Object.values(AUTH_ROLES);

  protected form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    telefono: [''],
    celular: [''],
    pais: [''],
    codigoPais: [''],
    dominioPrincipal: [''],
    empresaIds: this.fb.nonNullable.control<string[]>([]),
    rol: ['', Validators.required],
  });

  ngOnInit(): void {
    if (!this.esEdicion) {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls.password.updateValueAndValidity();
    }
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const empresas = await firstValueFrom(this.empresasService.getAll());
      this.empresas.set(empresas);

      if (this.id) {
        const usuario = await firstValueFrom(this.service.getById(this.id));
        this.form.patchValue({
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          email: usuario.email,
          telefono: usuario.telefono ?? '',
          celular: usuario.celular ?? '',
          pais: usuario.pais ?? '',
          codigoPais: usuario.codigoPais ?? '',
          dominioPrincipal: usuario.dominioPrincipal ?? '',
          empresaIds: usuario.empresaIds.filter(id => empresas.some(e => e.id === id && e.activo)),
          rol: usuario.roles[0] ?? '',
        });
      }

      this.cargado.set(true);
    } catch {
      this.errorMessage.set('No fue posible cargar la información del usuario.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.cargado()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const rol = value.rol.trim();

    if (rol !== AUTH_ROLES.ADMINISTRADOR && value.empresaIds.length === 0) {
      this.errorMessage.set('Selecciona al menos una empresa para el usuario.');
      return;
    }

    this.guardando.set(true);
    this.errorMessage.set(null);

    try {
      const datos = {
        nombre: value.nombre.trim(),
        apellidos: value.apellidos.trim(),
        email: value.email.trim(),
        telefono: this.nullIfEmpty(value.telefono),
        celular: this.nullIfEmpty(value.celular),
        pais: this.nullIfEmpty(value.pais),
        codigoPais: this.nullIfEmpty(value.codigoPais),
        empresa: null,
        dominioPrincipal: this.nullIfEmpty(value.dominioPrincipal),
        empresaIds: value.empresaIds,
      };

      if (this.esEdicion && this.id) {
        const dto: UsuarioUpdate = datos;
        await firstValueFrom(this.service.update(this.id, dto));
        await firstValueFrom(this.service.updateRoles(this.id, [rol]));
      } else {
        const dto: UsuarioCreate = {
          ...datos,
          password: value.password,
          roles: [rol],
        };
        await firstValueFrom(this.service.create(dto));
      }

      await this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/usuarios']);
  }

  private nullIfEmpty(value: string): string | null {
    return value.trim() || null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string')
      return error.error.message;
    return 'No fue posible guardar el usuario.';
  }
}