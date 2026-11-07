import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { EtiquetaPublicaService } from '../../services/etiqueta-publica.service';
import {
  EtiquetaPublica
} from '../../types/etiqueta-publica.types';

@Component({
  selector: 'app-ficha-activo',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  templateUrl: './ficha-activo.html',
})
export default class FichaActivoComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EtiquetaPublicaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(true);

  protected readonly etiqueta =
    signal<EtiquetaPublica | null>(null);

  protected readonly error =
    signal<string | null>(null);

  protected readonly token = signal('');

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const token = params.get('tokenPublico') ?? '';

          this.token.set(token);
          this.cargando.set(true);
          this.error.set(null);
          this.etiqueta.set(null);

          if (!token) {
            this.cargando.set(false);
            this.error.set('La etiqueta no es válida.');
            return of(null);
          }

          const origen = this.route.snapshot.queryParamMap
            .get('origen')
            ?.toUpperCase();

          return this.service.consultar(token, origen).pipe(
            catchError((err: HttpErrorResponse) => {
              if (err.status === 404) {
                this.error.set(
                  'La etiqueta no existe o no se encuentra disponible.'
                );
              } else {
                this.error.set(
                  'No fue posible consultar la información del equipo.'
                );
              }

              return of(null);
            }),
            finalize(() => this.cargando.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(resultado => {
        this.etiqueta.set(resultado);
      });
  }

  protected reintentar(): void {
    const token = this.token();

    if (!token || this.cargando()) {
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const origen = this.route.snapshot.queryParamMap
      .get('origen')
      ?.toUpperCase();

    this.service.consultar(token, origen)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resultado => {
          this.etiqueta.set(resultado);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(
            'No fue posible consultar la información. Inténtalo nuevamente.'
          );
          this.cargando.set(false);
        }
      });
  }
}