import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { mensajeApi } from '../../../shared/api-error';
import { EtiquetasService } from '../../services/etiquetas.service';
import { Etiqueta, EtiquetaNfcActualizar } from '../../types/etiqueta.types';

@Component({
  selector: 'app-etiqueta-detalle',
  templateUrl: './etiqueta-detalle.html',
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
})
export default class EtiquetaDetalleComponent {
  protected readonly empresa = inject(EmpresaContextoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EtiquetasService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  private anteriorEmpresa: string | null = null;

  protected readonly etiqueta = signal<Etiqueta | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly motivo = signal('');
  protected readonly puedeGestionar = computed(() => this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA]));
  protected readonly formNfc = this.fb.nonNullable.group({
    uidNfc: ['', Validators.maxLength(100)],
    nfcBloqueado: [false],
    confirmoVerificacionFisica: [false],
  });

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresa.seleccionada()?.id ?? null;
      if (empresaId && this.anteriorEmpresa && empresaId !== this.anteriorEmpresa) {
        void this.router.navigate(['/admin/etiquetas']);
        return;
      }
      this.anteriorEmpresa = empresaId;
      this.etiqueta.set(null); this.error.set(null); this.exito.set(null);
      this.cargando.set(!!empresaId);
      if (!empresaId || !this.id) return;
      const sub = this.service.getById(this.id).subscribe({
        next: item => {
          if (this.empresa.empresaId !== empresaId) return;
          this.asignar(item); this.cargando.set(false);
        },
        error: err => {
          if (this.empresa.empresaId !== empresaId) return;
          this.error.set(mensajeApi(err, 'No fue posible cargar la etiqueta.'));
          this.cargando.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected volver(): void { void this.router.navigate(['/admin/etiquetas']); }
  protected verActivo(id: string): void { void this.router.navigate(['/admin/activos', id]); }
  protected cambiarMotivo(event: Event): void { this.motivo.set((event.target as HTMLInputElement).value); }

  protected async copiar(valor: string): Promise<void> {
    this.error.set(null); this.exito.set(null);
    try {
      await navigator.clipboard.writeText(valor);
      this.exito.set('Copiado al portapapeles.');
    } catch {
      this.error.set('No fue posible copiar. Puedes seleccionar y copiar el texto manualmente.');
    }
  }

  protected async guardarNfc(): Promise<void> {
    const e = this.etiqueta();
    if (!e || !this.puedeGestionar() || e.anulada || !e.tieneNfc || this.guardando()) return;
    if (this.formNfc.invalid) { this.formNfc.markAllAsTouched(); return; }
    const valores = this.formNfc.getRawValue();
    if (valores.nfcBloqueado && !e.nfcBloqueado && !valores.confirmoVerificacionFisica) {
      this.error.set('Confirma que verificaste físicamente el bloqueo del NFC.'); return;
    }
    const dto: EtiquetaNfcActualizar = {
      uidNfc: valores.uidNfc.trim().toUpperCase() || null,
      nfcBloqueado: valores.nfcBloqueado,
      confirmoVerificacionFisica: valores.confirmoVerificacionFisica,
    };
    const empresaId = this.empresa.empresaId;
    this.guardando.set(true); this.error.set(null); this.exito.set(null);
    try {
      const actualizado = await firstValueFrom(this.service.actualizarNfc(this.id, dto));
      if (this.empresa.empresaId !== empresaId) return;
      this.asignar(actualizado);
      this.exito.set('Datos NFC actualizados. El registro del bloqueo no escribe ni bloquea el chip físicamente.');
    } catch (err) {
      if (this.empresa.empresaId === empresaId)
        this.error.set(mensajeApi(err, 'No fue posible actualizar el NFC.'));
    } finally { this.guardando.set(false); }
  }

  protected async anular(): Promise<void> {
    const e = this.etiqueta();
    if (!e || !this.puedeGestionar() || e.estatus !== 'DISPONIBLE' || this.guardando()) return;
    const motivo = this.motivo().trim();
    if (!motivo) { this.error.set('Es obligatorio indicar el motivo de anulación.'); return; }
    if (!confirm('¿Anular definitivamente esta etiqueta? No podrá vincularse a ningún activo.')) return;
    const empresaId = this.empresa.empresaId;
    this.guardando.set(true); this.error.set(null); this.exito.set(null);
    try {
      await firstValueFrom(this.service.anular(this.id, motivo));
      const actualizado = await firstValueFrom(this.service.getById(this.id));
      if (empresaId !== this.empresa.empresaId) return;
      this.asignar(actualizado);
      this.motivo.set(''); this.exito.set('Etiqueta anulada correctamente.');
    } catch (err) {
      if (empresaId === this.empresa.empresaId)
        this.error.set(mensajeApi(err, 'No fue posible anular la etiqueta.'));
    } finally { this.guardando.set(false); }
  }

  private asignar(e: Etiqueta): void {
    this.etiqueta.set(e);
    this.formNfc.reset({ uidNfc: e.uidNfc ?? '', nfcBloqueado: e.nfcBloqueado, confirmoVerificacionFisica: false });
    if (e.nfcBloqueado || !this.puedeGestionar() || e.anulada) this.formNfc.disable({ emitEvent: false });
    else this.formNfc.enable({ emitEvent: false });
  }
}
