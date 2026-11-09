import {
  Component,
  computed,
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
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { ResponsablesService } from '../../../responsables/services/responsables.service';
import { Responsable } from '../../../responsables/types/responsable.types';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoAsignacionesService } from '../../services/activo-asignaciones.service';
import {
  ActivoAsignacionCrear,
  ActivoSinAsignar,
} from '../../types/activo-asignacion.types';

@Component({
  selector: 'app-asignacion-form',
  templateUrl: './asignacion-form.html',
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
export default class AsignacionForm {

  protected readonly empresa = inject(EmpresaContextoService);

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  private readonly service = inject(ActivoAsignacionesService);
  private readonly responsablesService = inject(ResponsablesService);

  private solicitudActivos = 0;
  private solicitudResponsables = 0;

  protected readonly activos = signal<ActivoSinAsignar[]>([]);
  protected readonly responsables = signal<Responsable[]>([]);

  protected readonly cargandoActivos = signal(false);
  protected readonly cargandoResponsables = signal(false);
  protected readonly guardando = signal(false);

  protected readonly error = signal<string | null>(null);

  protected readonly buscarActivo = signal('');
  protected readonly buscarResponsable = signal('');

  protected readonly paginaActivos = signal(1);
  protected readonly paginasActivos = signal(1);

  protected readonly paginaResponsables = signal(1);
  protected readonly paginasResponsables = signal(1);

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  protected readonly form = this.fb.nonNullable.group({
    activoId: ['', Validators.required],
    responsableId: ['', Validators.required],

    motivoAsignacion: ['', Validators.maxLength(300)],

    observacionesAsignacion: [
      '',
      Validators.maxLength(1000),
    ],
  });

  constructor() {

    effect(() => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      ++this.solicitudActivos;
      ++this.solicitudResponsables;

      this.activos.set([]);
      this.responsables.set([]);

      this.paginaActivos.set(1);
      this.paginaResponsables.set(1);

      this.paginasActivos.set(1);
      this.paginasResponsables.set(1);

      this.buscarActivo.set('');
      this.buscarResponsable.set('');

      this.error.set(null);
      this.form.reset();

      if (!empresaId) return;

      const activoId =
        this.route.snapshot.queryParamMap.get('activoId');

      if (activoId) {
        this.form.controls.activoId.setValue(activoId);
      }

      void this.cargarActivos();
      void this.cargarResponsables();

    });
  }

  protected cambiarBusquedaActivo(event: Event): void {
    this.buscarActivo.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected cambiarBusquedaResponsable(event: Event): void {
    this.buscarResponsable.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected buscarActivos(): void {
    this.paginaActivos.set(1);
    void this.cargarActivos();
  }

  protected buscarResponsables(): void {
    this.paginaResponsables.set(1);
    void this.cargarResponsables();
  }

  protected cambiarPaginaActivos(valor: number): void {

    if (
      valor < 1 ||
      valor > this.paginasActivos()
    ) return;

    this.paginaActivos.set(valor);

    void this.cargarActivos();
  }

  protected cambiarPaginaResponsables(valor: number): void {

    if (
      valor < 1 ||
      valor > this.paginasResponsables()
    ) return;

    this.paginaResponsables.set(valor);

    void this.cargarResponsables();
  }

  private async cargarActivos(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) return;

    const solicitudActual = ++this.solicitudActivos;

    this.cargandoActivos.set(true);

    try {

      const resultado = await firstValueFrom(
        this.service.getActivosSinAsignar(
          this.buscarActivo(),
          undefined,
          this.paginaActivos(),
          20
        )
      );

      if (
        solicitudActual !== this.solicitudActivos ||
        this.empresa.empresaId !== empresaId
      ) return;

      this.activos.set(resultado.items);

      this.paginasActivos.set(
        Math.max(1, resultado.totalPaginas)
      );

      // Conservar visible el activo seleccionado
      // cuando se cambia de página.
      const seleccionado = this.form.controls.activoId.value;

      if (
        seleccionado &&
        !resultado.items.some(x => x.id === seleccionado)
      ) {
        this.form.controls.activoId.setValue('');
      }

    } catch (err) {

      if (
        solicitudActual === this.solicitudActivos &&
        this.empresa.empresaId === empresaId
      ) {
        this.error.set(
          mensajeApi(err, 'No fue posible cargar los activos.')
        );
      }

    } finally {

      if (solicitudActual === this.solicitudActivos) {
        this.cargandoActivos.set(false);
      }
    }
  }

  private async cargarResponsables(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) return;

    const solicitudActual = ++this.solicitudResponsables;

    this.cargandoResponsables.set(true);

    try {

      const resultado = await firstValueFrom(
        this.responsablesService.getAll({
          buscar: this.buscarResponsable(),
          activo: true,
          pagina: this.paginaResponsables(),
          tamanoPagina: 20,
        })
      );

      if (
        solicitudActual !== this.solicitudResponsables ||
        this.empresa.empresaId !== empresaId
      ) return;

      this.responsables.set(resultado.items);

      this.paginasResponsables.set(
        Math.max(1, resultado.totalPaginas)
      );

      const seleccionado =
        this.form.controls.responsableId.value;

      if (
        seleccionado &&
        !resultado.items.some(x => x.id === seleccionado)
      ) {
        this.form.controls.responsableId.setValue('');
      }

    } catch (err) {

      if (
        solicitudActual === this.solicitudResponsables &&
        this.empresa.empresaId === empresaId
      ) {
        this.error.set(
          mensajeApi(err, 'No fue posible cargar responsables.')
        );
      }

    } finally {

      if (solicitudActual === this.solicitudResponsables) {
        this.cargandoResponsables.set(false);
      }
    }
  }

  protected async guardar(): Promise<void> {

    if (
      this.guardando() ||
      !this.puedeGestionar()
    ) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const empresaId = this.empresa.empresaId;

    if (!empresaId) {
      this.error.set('Selecciona una empresa.');
      return;
    }

    const f = this.form.getRawValue();

    const dto: ActivoAsignacionCrear = {
      activoId: f.activoId,
      responsableId: f.responsableId,

      fechaAsignacion: null,

      motivoAsignacion:
        f.motivoAsignacion.trim() || null,

      observacionesAsignacion:
        f.observacionesAsignacion.trim() || null,
    };

    this.guardando.set(true);
    this.error.set(null);

    try {

      const creado = await firstValueFrom(
        this.service.create(dto)
      );

      if (this.empresa.empresaId === empresaId) {

        await this.router.navigate([
          '/admin/asignaciones',
          creado.id,
        ]);
      }

    } catch (err) {

      if (this.empresa.empresaId === empresaId) {
        this.error.set(
          mensajeApi(err, 'No fue posible registrar la asignación.')
        );
      }

    } finally {

      this.guardando.set(false);
    }
  }

  protected volver(): void {
    void this.router.navigate(['/admin/asignaciones']);
  }
}