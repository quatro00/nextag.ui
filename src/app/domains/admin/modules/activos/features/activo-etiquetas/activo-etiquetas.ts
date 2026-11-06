import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoEtiquetasService } from '../../../etiquetas/services/activo-etiquetas.service';
import { EtiquetasService } from '../../../etiquetas/services/etiquetas.service';
import { ActivoEtiquetaHistorial, Etiqueta } from '../../../etiquetas/types/etiqueta.types';

@Component({
  selector: 'app-activo-etiquetas',
  templateUrl: './activo-etiquetas.html',
  imports: [DatePipe, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
})
export class ActivoEtiquetas {
  readonly activoId = input.required<string>();
  readonly activoEstadoId = input(1);
  readonly puedeGestionar = input(false);
  protected readonly empresa = inject(EmpresaContextoService);
  private readonly service = inject(ActivoEtiquetasService);
  private readonly etiquetasService = inject(EtiquetasService);
  private readonly router = inject(Router);
  private solicitud = 0;
  private solicitudDisponibles = 0;

  protected readonly historial = signal<ActivoEtiquetaHistorial[]>([]);
  protected readonly disponibles = signal<Etiqueta[]>([]);
  protected readonly cargando = signal(false);
  protected readonly cargandoDisponibles = signal(false);
  protected readonly operando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly buscador = signal('');
  protected readonly busqueda = signal('');
  protected readonly disponibleId = signal('');
  protected readonly motivo = signal('');
  protected readonly paginaDisponible = signal(1);
  protected readonly totalDisponibles = signal(0);
  protected readonly paginasDisponibles = computed(() => Math.max(1, Math.ceil(this.totalDisponibles() / 20)));
  protected readonly vigente = computed(() => this.historial().find(x => x.vigente) ?? null);
  protected readonly editable = computed(() => this.puedeGestionar() && this.activoEstadoId() !== 7);

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresa.seleccionada()?.id ?? null;
      const activoId = this.activoId();
      ++this.solicitud; ++this.solicitudDisponibles;
      this.historial.set([]); this.disponibles.set([]); this.disponibleId.set('');
      this.error.set(null); this.exito.set(null); this.cargando.set(!!empresaId && !!activoId);
      if (!empresaId || !activoId) return;
      const req = ++this.solicitud;
      const sub = this.service.historial(activoId).subscribe({
        next: items => {
          if (req !== this.solicitud || this.empresa.empresaId !== empresaId || this.activoId() !== activoId) return;
          this.historial.set(items); this.cargando.set(false);
          void this.cargarDisponibles();
        },
        error: err => {
          if (req !== this.solicitud || this.empresa.empresaId !== empresaId || this.activoId() !== activoId) return;
          this.error.set(mensajeApi(err, 'No fue posible cargar el historial de etiquetas.'));
          this.cargando.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarBuscador(event: Event): void { this.buscador.set((event.target as HTMLInputElement).value); }
  protected cambiarMotivo(event: Event): void { this.motivo.set((event.target as HTMLInputElement).value); }
  protected buscarDisponibles(): void {
    this.busqueda.set(this.buscador().trim()); this.paginaDisponible.set(1); this.disponibleId.set('');
    void this.cargarDisponibles();
  }
  protected cambiarPagina(valor: number): void {
    if (valor < 1 || valor > this.paginasDisponibles() || this.cargandoDisponibles()) return;
    this.paginaDisponible.set(valor); this.disponibleId.set('');
    void this.cargarDisponibles();
  }
  protected seleccionar(id: string): void { this.disponibleId.set(id); }
  protected administrar(): void { void this.router.navigate(['/admin/etiquetas']); }
  protected verEtiqueta(id: string): void { void this.router.navigate(['/admin/etiquetas', id]); }

  protected async cargarDisponibles(): Promise<void> {
    const empresaId = this.empresa.empresaId;
    if (!empresaId || !this.editable()) return;
    const req = ++this.solicitudDisponibles;
    this.cargandoDisponibles.set(true);
    try {
      const datos = await firstValueFrom(this.etiquetasService.getAll({
        estatus: 'DISPONIBLE',
        buscar: this.busqueda() || undefined,
        pagina: this.paginaDisponible(), tamanoPagina: 20,
      }));
      if (req !== this.solicitudDisponibles || this.empresa.empresaId !== empresaId) return;
      this.disponibles.set(datos.items); this.totalDisponibles.set(datos.total);
    } catch (err) {
      if (req === this.solicitudDisponibles && this.empresa.empresaId === empresaId)
        this.error.set(mensajeApi(err, 'No fue posible consultar las etiquetas disponibles.'));
    } finally {
      if (req === this.solicitudDisponibles) this.cargandoDisponibles.set(false);
    }
  }

  protected async guardarVinculo(): Promise<void> {
    if (!this.editable() || !this.disponibleId() || this.operando()) return;
    const empresaId = this.empresa.empresaId;
    const activoId = this.activoId();
    const etiquetaId = this.disponibleId();
    const reemplazo = !!this.vigente();
    const motivo = this.motivo().trim();
    if (reemplazo && !motivo) { this.error.set('Indica el motivo del reemplazo.'); return; }
    if (!confirm(reemplazo ? '¿Reemplazar la etiqueta actual? La anterior se anulará definitivamente.' : '¿Vincular esta etiqueta al activo?')) return;
    this.operando.set(true); this.error.set(null); this.exito.set(null);
    try {
      if (reemplazo) await firstValueFrom(this.service.reemplazar(activoId, etiquetaId, motivo));
      else await firstValueFrom(this.service.vincular(activoId, etiquetaId));
      if (this.empresa.empresaId !== empresaId || this.activoId() !== activoId) return;
      this.disponibleId.set(''); this.motivo.set('');
      await this.recargarHistorial();
      await this.cargarDisponibles();
      this.exito.set(reemplazo ? 'Etiqueta reemplazada correctamente.' : 'Etiqueta vinculada correctamente.');
    } catch (err) {
      if (this.empresa.empresaId === empresaId && this.activoId() === activoId)
        this.error.set(mensajeApi(err, 'No fue posible vincular la etiqueta.'));
    } finally { this.operando.set(false); }
  }

  protected async desvincular(): Promise<void> {
    if (!this.editable() || !this.vigente() || this.operando()) return;
    const motivo = this.motivo().trim();
    if (!motivo) { this.error.set('Indica el motivo de desvinculación.'); return; }
    if (!confirm('¿Desvincular y anular definitivamente la etiqueta vigente?')) return;
    const empresaId = this.empresa.empresaId;
    const activoId = this.activoId();
    this.operando.set(true); this.error.set(null); this.exito.set(null);
    try {
      await firstValueFrom(this.service.desvincular(activoId, motivo));
      if (this.empresa.empresaId !== empresaId || this.activoId() !== activoId) return;
      this.motivo.set(''); this.disponibleId.set('');
      await this.recargarHistorial();
      await this.cargarDisponibles();
      this.exito.set('Etiqueta desvinculada y anulada correctamente.');
    } catch (err) {
      if (this.empresa.empresaId === empresaId && this.activoId() === activoId)
        this.error.set(mensajeApi(err, 'No fue posible desvincular la etiqueta.'));
    } finally { this.operando.set(false); }
  }

  private async recargarHistorial(): Promise<void> {
    const empresaId = this.empresa.empresaId;
    const activoId = this.activoId();
    const req = ++this.solicitud;
    const datos = await firstValueFrom(this.service.historial(activoId));
    if (req === this.solicitud && empresaId === this.empresa.empresaId && activoId === this.activoId())
      this.historial.set(datos);
  }
}
