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

import { firstValueFrom, forkJoin } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';

import { CategoriasTicketService } from
  '../../../categorias-ticket/services/categorias-ticket.service';

import { CategoriaTicketList } from
  '../../../categorias-ticket/types/categoria-ticket.types';

import { ActivosService } from
  '../../../activos/services/activos.service';

import { ActivoList } from
  '../../../activos/types/activo.types';

import { mensajeApi } from '../../../shared/api-error';

import { TicketsService } from
  '../../services/tickets.service';

import {
  TicketCatalogo,
  TicketGuardar,
} from '../../types/ticket.types';

@Component({
  selector: 'app-ticket-form',
  templateUrl: './ticket-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export default class TicketForm {

  private readonly fb = inject(FormBuilder);

  private readonly service =
    inject(TicketsService);

  private readonly categoriasService =
    inject(CategoriasTicketService);

  private readonly activosService =
    inject(ActivosService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly empresa =
    inject(EmpresaContextoService);

  // ==========================================
  // DATOS
  // ==========================================

  protected readonly categorias =
    signal<CategoriaTicketList[]>([]);

  protected readonly prioridades =
    signal<TicketCatalogo[]>([]);

  protected readonly activos =
    signal<ActivoList[]>([]);

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);

  protected readonly error =
    signal<string | null>(null);

  private readonly id =
    this.route.snapshot.paramMap.get('id');

  protected readonly esEdicion = !!this.id;

  private solicitud = 0;

  // ==========================================
  // FORMULARIO
  // ==========================================

  protected readonly form = this.fb.nonNullable.group({

    titulo: ['', [
      Validators.required,
      Validators.maxLength(200),
    ]],

    descripcion: ['', Validators.required],

    categoriaTicketId: [''],

    prioridadTicketId: [
      0,
      Validators.min(1),
    ],

    activoId: [''],
  });

  // ==========================================
  // INICIALIZAR
  // ==========================================

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const req = ++this.solicitud;

      this.form.reset();

      this.categorias.set([]);
      this.prioridades.set([]);
      this.activos.set([]);

      this.error.set(null);
      this.cargando.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const sub = forkJoin({

        categorias: this.categoriasService.getAll(),

        prioridades: this.service.getPrioridades(),

        activos: this.activosService.getAll({
          pagina: 1,
          tamanoPagina: 100,
        }),

        detalle: this.id
          ? this.service.getById(this.id)
          : [null],

      }).subscribe({

        next: datos => {

          if (
            req !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.categorias.set(datos.categorias);

          this.prioridades.set(datos.prioridades);

          this.activos.set(datos.activos.items);

          if (datos.detalle) {

            this.form.patchValue({

              titulo: datos.detalle.titulo,

              descripcion: datos.detalle.descripcion,

              categoriaTicketId:
                datos.detalle.categoriaTicketId ?? '',

              prioridadTicketId:
                datos.detalle.prioridadTicketId,

              activoId:
                datos.detalle.activoId ?? '',
            });

          } else {

            const prioridadMedia =
              datos.prioridades.find(x =>
                x.clave === 'MEDIA'
              );

            this.form.controls.prioridadTicketId.setValue(
              prioridadMedia?.id ??
              datos.prioridades[0]?.id ??
              0
            );
          }

          this.cargando.set(false);
        },

        error: err => {

          if (
            req !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.error.set(
            mensajeApi(
              err,
              'No fue posible cargar el formulario.'
            )
          );

          this.cargando.set(false);
        },
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  // ==========================================
  // GUARDAR
  // ==========================================

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

    const dto: TicketGuardar = {

      titulo: valores.titulo.trim(),

      descripcion: valores.descripcion.trim(),

      categoriaTicketId:
        valores.categoriaTicketId || null,

      prioridadTicketId:
        valores.prioridadTicketId,

      activoId:
        valores.activoId || null,
    };

    if (!dto.titulo || !dto.descripcion) {

      this.error.set(
        'El título y la descripción son obligatorios.'
      );

      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const empresaId = this.empresa.empresaId;

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

      if (this.empresa.empresaId !== empresaId) {
        return;
      }

      await this.router.navigate([
        '/admin/tickets',
      ]);

    } catch (err) {

      if (this.empresa.empresaId === empresaId) {

        this.error.set(
          mensajeApi(
            err,
            'No fue posible guardar el ticket.'
          )
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
      '/admin/tickets',
    ]);
  }
}