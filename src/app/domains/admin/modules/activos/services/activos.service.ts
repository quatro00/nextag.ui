import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { ActivoDetalle, ActivoFiltros, ActivoGuardar, ActivoPagina, EstadoActivo } from '../types/activo.types';

@Injectable({ providedIn: 'root' })
export class ActivosService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly endpoint = `${this.api}/activos`;

  getAll(filtros: ActivoFiltros = {}): Observable<ActivoPagina> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<ActivoPagina>(this.endpoint, { params });
  }

  getById(id: string): Observable<ActivoDetalle> {
    return this.http.get<ActivoDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: ActivoGuardar): Observable<ActivoDetalle> {
    return this.http.post<ActivoDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: ActivoGuardar): Observable<ActivoDetalle> {
    return this.http.put<ActivoDetalle>(`${this.endpoint}/${id}`, dto);
  }

  getEstados(): Observable<EstadoActivo[]> {
    return this.http.get<EstadoActivo[]>(`${this.api}/estados-activo`);
  }
}
