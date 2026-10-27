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
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { UsuarioRoles } from '../../components/usuario-roles/usuario-roles';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioCreate, UsuarioUpdate } from '../../types/usuario.types';


@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.html',
  imports: [
     ReactiveFormsModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatProgressSpinnerModule,
  UsuarioRoles,
  ],
})
export default class UsuarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosService);

  protected id = this.route.snapshot.paramMap.get('id');
  protected esEdicion = !!this.id;
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected rolesSeleccionados = signal<string[]>([]);
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
    empresa: [''],
    dominioPrincipal: [''],
  });

  ngOnInit(): void {
    if (!this.esEdicion) {
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(6),
      ]);
      this.form.controls.password.updateValueAndValidity();
      return;
    }

    void this.cargar();
  }

  private async cargar(): Promise<void> {
    if (!this.id) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const usuario = await firstValueFrom(
        this.service.getById(this.id)
      );

      this.form.patchValue({
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono ?? '',
        celular: usuario.celular ?? '',
        pais: usuario.pais ?? '',
        codigoPais: usuario.codigoPais ?? '',
        empresa: usuario.empresa ?? '',
        dominioPrincipal: usuario.dominioPrincipal ?? '',
      });

      this.rolesSeleccionados.set(usuario.roles);
    } catch {
      this.errorMessage.set('No fue posible cargar el usuario.');
    } finally {
      this.loading.set(false);
    }
  }

  protected cambiarRoles(roles: string[]): void {
    this.rolesSeleccionados.set(roles);
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.rolesSeleccionados().length) {
      this.errorMessage.set('Selecciona al menos un rol.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const value = this.form.getRawValue();

      if (this.esEdicion && this.id) {
        const dto: UsuarioUpdate = {
          nombre: value.nombre.trim(),
          apellidos: value.apellidos.trim(),
          email: value.email.trim(),
          telefono: this.nullIfEmpty(value.telefono),
          celular: this.nullIfEmpty(value.celular),
          pais: this.nullIfEmpty(value.pais),
          codigoPais: this.nullIfEmpty(value.codigoPais),
          empresa: this.nullIfEmpty(value.empresa),
          dominioPrincipal: this.nullIfEmpty(value.dominioPrincipal),
        };

        await firstValueFrom(this.service.update(this.id, dto));
        await firstValueFrom(
          this.service.updateRoles(this.id, this.rolesSeleccionados())
        );
      } else {
        const dto: UsuarioCreate = {
          nombre: value.nombre.trim(),
          apellidos: value.apellidos.trim(),
          email: value.email.trim(),
          password: value.password,
          telefono: this.nullIfEmpty(value.telefono),
          celular: this.nullIfEmpty(value.celular),
          pais: this.nullIfEmpty(value.pais),
          codigoPais: this.nullIfEmpty(value.codigoPais),
          empresa: this.nullIfEmpty(value.empresa),
          dominioPrincipal: this.nullIfEmpty(value.dominioPrincipal),
          roles: this.rolesSeleccionados(),
        };

        await firstValueFrom(this.service.create(dto));
      }

      await this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/usuarios']);
  }

  private nullIfEmpty(value: string): string | null {
    const result = value.trim();
    return result ? result : null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse)
      return error.error?.message ?? 'No fue posible guardar el usuario.';

    return 'No fue posible guardar el usuario.';
  }
}