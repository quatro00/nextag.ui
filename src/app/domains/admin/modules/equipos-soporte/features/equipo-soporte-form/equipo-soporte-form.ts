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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';

import { ProveedoresService } from
  '../../../proveedores/services/proveedores.service';

import { ProveedorList } from
  '../../../proveedores/types/proveedor.types';

import { mensajeApi } from '../../../shared/api-error';

import { EquiposSoporteService } from
  '../../services/equipos-soporte.service';

import {
  EquipoSoporteGuardar,
  TipoEquipoSoporte,
} from '../../types/equipo-soporte.types';

@Component({
  selector: 'app-equipo-soporte-form',
  templateUrl: './equipo-soporte-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export default class EquipoSoporteForm {

  private readonly fb = inject(FormBuilder);

  private readonly service =
    inject(EquiposSoporteService);

  private readonly proveedoresService =
    inject(ProveedoresService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly empresa =
    inject(EmpresaContextoService);

  protected readonly proveedores =
    signal<ProveedorList[]>([]);

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

    tipo: [
      'INTERNO' as TipoEquipoSoporte,
      Validators.required,
    ],

    proveedorId: [''],

    correoContacto: ['', [
      Validators.email,
      Validators.maxLength(200),
    ]],
  });

  private solicitud = 0;

  constructor() {
    effect(() => {
      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const req = ++this.solicitud;

      this.form.reset();
      this.proveedores.set([]);
      this.error.set(null);

      if (empresaId) {
        void this.cargar(req, empresaId);
      }
    });
  }

  private async cargar(
    req: number,
    empresaId: string
  ): Promise<void> {

    this.cargando.set(true);

    try {
      const [proveedores, detalle] = await Promise.all([
        firstValueFrom(
          this.proveedoresService.getAll({
            activo: true,
          })
        ),

        this.id
          ? firstValueFrom(this.service.getById(this.id))
          : Promise.resolve(null),
      ]);

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) {
        return;
      }

      this.proveedores.set(proveedores);

      if (detalle) {
        this.form.patchValue({
          clave: detalle.clave,
          nombre: detalle.nombre,
          descripcion: detalle.descripcion ?? '',
          tipo: detalle.tipo,
          proveedorId: detalle.proveedorId ?? '',
          correoContacto: detalle.correoContacto ?? '',
        });
      }

    } catch (err) {
      if (
        req === this.solicitud &&
        this.empresa.empresaId === empresaId
      ) {
        this.error.set(
          mensajeApi(
            err,
            'No fue posible cargar el formulario.'
          )
        );
      }

    } finally {
      if (req === this.solicitud) {
        this.cargando.set(false);
      }
    }
  }

  protected cambiarTipo(
    tipo: TipoEquipoSoporte
  ): void {
    this.form.controls.tipo.setValue(tipo);

    if (tipo === 'INTERNO') {
      this.form.controls.proveedorId.setValue('');
    }
  }

  protected async guardar(): Promise<void> {

    if (
      this.form.invalid ||
      this.guardando() ||
      !this.empresa.empresaId
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();

    const dto: EquipoSoporteGuardar = {
      clave: valores.clave.trim(),
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      tipo: valores.tipo,
      proveedorId:
        valores.tipo === 'INTERNO'
          ? null
          : valores.proveedorId || null,
      correoContacto:
        valores.correoContacto.trim() || null,
    };

    if (!dto.clave || !dto.nombre) {
      this.error.set(
        'La clave y el nombre son obligatorios.'
      );
      return;
    }

    if (
      dto.tipo !== 'INTERNO' &&
      !dto.proveedorId
    ) {
      this.error.set(
        'Selecciona un proveedor para los equipos externos o mixtos.'
      );
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
        '/admin/equipos-soporte',
      ]);

    } catch (err) {
      this.error.set(
        mensajeApi(
          err,
          'No fue posible guardar el equipo.'
        )
      );

    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate([
      '/admin/equipos-soporte',
    ]);
  }
}