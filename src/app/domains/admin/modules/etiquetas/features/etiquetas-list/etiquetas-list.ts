import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { EtiquetasService } from '../../services/etiquetas.service';
import { Etiqueta, EtiquetaPagina, EstatusEtiqueta } from '../../types/etiqueta.types';
import { mensajeApi } from '../../../shared/api-error';


@Component({
  selector: 'app-etiquetas-list',
  templateUrl: './etiquetas-list.html',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatTooltipModule],
})
export default class EtiquetasList {
  protected readonly empresa = inject(EmpresaContextoService);
  private readonly auth = inject(AuthService);
  private readonly service = inject(EtiquetasService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private solicitud = 0;

  protected readonly items = signal<Etiqueta[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly generando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly buscarTexto = signal('');
  protected readonly estatus = signal<'' | EstatusEtiqueta>('');
  protected readonly tipo = signal<'todos' | 'nfc' | 'qr' | 'ambos'>('todos');
  protected readonly pagina = signal(1);
  protected readonly tamanoPagina = 20;
  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamanoPagina)));
  protected readonly generado = signal<Etiqueta[]>([]);
  protected readonly mostrarGenerador = signal(false);
  protected readonly puedeGestionar = computed(() => this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA]));
  protected readonly generador = this.fb.nonNullable.group({
    cantidad: [10, [Validators.required, Validators.min(1), Validators.max(250)]],
    tieneNfc: [true],
    tieneQr: [true],
    esAntimetal: [false],
  });

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresa.seleccionada()?.id ?? null;
      ++this.solicitud;
      this.items.set([]); this.total.set(0); this.texto.set(''); this.buscarTexto.set('');
      this.estatus.set(''); this.tipo.set('todos'); this.pagina.set(1);
      this.generado.set([]); this.mostrarGenerador.set(false);
      this.error.set(null); this.exito.set(null); this.loading.set(!!empresaId);
      if (!empresaId) return;
      const req = ++this.solicitud;
      const sub = this.service.getAll({ pagina: 1, tamanoPagina: this.tamanoPagina }).subscribe({
        next: datos => {
          if (this.empresa.empresaId !== empresaId || req !== this.solicitud) return;
          this.colocarPagina(datos); this.loading.set(false);
        },
        error: err => {
          if (this.empresa.empresaId !== empresaId || req !== this.solicitud) return;
          this.error.set(mensajeApi(err, 'No fue posible cargar las etiquetas.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarTexto(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }
  protected buscar(): void { this.buscarTexto.set(this.texto().trim()); this.pagina.set(1); void this.recargar(); }
  protected cambiarEstatus(v: '' | EstatusEtiqueta): void { this.estatus.set(v); this.pagina.set(1); void this.recargar(); }
  protected cambiarTipo(v: 'todos' | 'nfc' | 'qr' | 'ambos'): void { this.tipo.set(v); this.pagina.set(1); void this.recargar(); }
  protected cambiarPagina(valor: number): void {
    if (this.loading() || valor < 1 || valor > this.paginas()) return;
    this.pagina.set(valor); void this.recargar();
  }
  protected ver(id: string): void { void this.router.navigate(['/admin/etiquetas', id]); }
  protected configurar(): void {

  void this.router.navigate([
    '/admin/etiquetas',
    'configuracion',
  ]);
}
  protected toggleGenerador(): void { this.mostrarGenerador.update(x => !x); }
  protected limpiar(): void {
    this.texto.set(''); this.buscarTexto.set(''); this.estatus.set(''); this.tipo.set('todos');
    this.pagina.set(1); void this.recargar();
  }

  protected async generar(): Promise<void> {
    if (!this.puedeGestionar() || this.generando() || !this.empresa.empresaId) return;
    if (this.generador.invalid) { this.generador.markAllAsTouched(); return; }
    const dto = this.generador.getRawValue();
    if (!Number.isInteger(dto.cantidad) || dto.cantidad < 1 || dto.cantidad > 250) {
      this.error.set('La cantidad debe ser un entero entre 1 y 250.'); return;
    }
    if (!dto.tieneNfc && !dto.tieneQr) { this.error.set('Selecciona NFC, QR o ambos.'); return; }
    if (dto.esAntimetal && !dto.tieneNfc) { this.error.set('Una etiqueta antimetal debe incluir NFC.'); return; }
    if (!confirm(`¿Generar ${dto.cantidad} etiquetas nuevas para esta empresa?`)) return;
    const empresaId = this.empresa.empresaId;
    this.generando.set(true); this.error.set(null); this.exito.set(null);
    try {
      const items = await firstValueFrom(this.service.generar(dto));
      if (empresaId !== this.empresa.empresaId) return;
      this.generado.set(items);
      this.exito.set(`${items.length} etiquetas generadas correctamente. Puedes exportar este lote como CSV.`);
      this.pagina.set(1);
      await this.recargar();
    } catch (err) {
      if (empresaId === this.empresa.empresaId)
        this.error.set(mensajeApi(err, 'No fue posible generar las etiquetas.'));
    } finally { this.generando.set(false); }
  }

  /** CSV del último lote generado en esta sesión. No es todavía una orden de impresión. */
  protected exportarCsv(): void {
    const lista = this.generado();
    if (!lista.length) return;
    const campo = (valor: string | boolean | null): string => {
      const s = String(valor ?? '');
      const seguro = /^[=+@\-\t\r]/.test(s) ? `'${s}` : s;
      return `"${seguro.replace(/"/g, '""')}"`;
    };
    const filas = [
      ['Codigo', 'TokenPublico', 'UrlPublica', 'TieneNfc', 'TieneQr', 'EsAntimetal'],
      ...lista.map(x => [x.codigo, x.tokenPublico, x.urlPublica ?? '', String(x.tieneNfc), String(x.tieneQr), String(x.esAntimetal)]),
    ];
    const blob = new Blob(['\uFEFF' + filas.map(f => f.map(x => campo(x)).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `nextag-etiquetas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click(); URL.revokeObjectURL(url);
  }

  private async recargar(): Promise<void> {
    const empresaId = this.empresa.empresaId;
    if (!empresaId) return;
    const req = ++this.solicitud;
    this.loading.set(true); this.error.set(null);
    const tipo = this.tipo();
    try {
      const datos = await firstValueFrom(this.service.getAll({
        pagina: this.pagina(), tamanoPagina: this.tamanoPagina,
        buscar: this.buscarTexto() || undefined,
        estatus: this.estatus() || undefined,
        tieneNfc: tipo === 'nfc' || tipo === 'ambos' ? true : tipo === 'qr' ? false : undefined,
        tieneQr: tipo === 'qr' || tipo === 'ambos' ? true : tipo === 'nfc' ? false : undefined,
      }));
      if (req !== this.solicitud || empresaId !== this.empresa.empresaId) return;
      this.colocarPagina(datos);
    } catch (err) {
      if (req === this.solicitud && empresaId === this.empresa.empresaId)
        this.error.set(mensajeApi(err, 'No fue posible consultar las etiquetas.'));
    } finally { if (req === this.solicitud) this.loading.set(false); }
  }

  private colocarPagina(datos: EtiquetaPagina): void {
    this.items.set(datos.items); this.total.set(datos.total);
  }
}
