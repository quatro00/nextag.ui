import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { ActivoEtiquetaHistorial } from '../types/etiqueta.types';

@Injectable({ providedIn: 'root' })
export class ActivoEtiquetasService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private url(activoId: string): string {
    return `${this.api}/activos/${activoId}/etiquetas`;
  }

  historial(activoId: string): Observable<ActivoEtiquetaHistorial[]> {
    return this.http.get<ActivoEtiquetaHistorial[]>(this.url(activoId));
  }

  vigente(activoId: string): Observable<ActivoEtiquetaHistorial> {
    return this.http.get<ActivoEtiquetaHistorial>(`${this.url(activoId)}/vigente`);
  }

  vincular(activoId: string, etiquetaId: string): Observable<ActivoEtiquetaHistorial> {
    return this.http.post<ActivoEtiquetaHistorial>(`${this.url(activoId)}/vincular`, { etiquetaId });
  }

  reemplazar(activoId: string, etiquetaId: string, motivo: string): Observable<ActivoEtiquetaHistorial> {
    return this.http.post<ActivoEtiquetaHistorial>(`${this.url(activoId)}/reemplazar`, { etiquetaId, motivo });
  }

  desvincular(activoId: string, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.url(activoId)}/desvincular`, { motivo });
  }
}
