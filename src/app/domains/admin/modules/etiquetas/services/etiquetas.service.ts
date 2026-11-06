import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  Etiqueta, EtiquetaFiltros, EtiquetaGenerar, EtiquetaNfcActualizar, EtiquetaPagina,
} from '../types/etiqueta.types';

@Injectable({ providedIn: 'root' })
export class EtiquetasService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL)}/etiquetas`;

  getAll(filtros: EtiquetaFiltros = {}): Observable<EtiquetaPagina> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<EtiquetaPagina>(this.endpoint, { params });
  }

  getById(id: string): Observable<Etiqueta> {
    return this.http.get<Etiqueta>(`${this.endpoint}/${id}`);
  }

  generar(dto: EtiquetaGenerar): Observable<Etiqueta[]> {
    return this.http.post<Etiqueta[]>(`${this.endpoint}/generar`, dto);
  }

  actualizarNfc(id: string, dto: EtiquetaNfcActualizar): Observable<Etiqueta> {
    return this.http.patch<Etiqueta>(`${this.endpoint}/${id}/nfc`, dto);
  }

  anular(id: string, motivo: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.endpoint}/${id}/anular`, { motivo });
  }
}
