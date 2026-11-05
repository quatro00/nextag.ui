import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  ModeloActivoCreate,
  ModeloActivoDetalle,
  ModeloActivoList,
  ModeloActivoUpdate,
  ModelosActivoFiltros,
} from '../types/modelo-activo.types';

@Injectable({ providedIn: 'root' })
export class ModelosActivoService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL)}/modelos-activo`;

  getAll(filtros: ModelosActivoFiltros = {}): Observable<ModeloActivoList[]> {
    let params = new HttpParams();
    if (filtros.marcaId) params = params.set('marcaId', filtros.marcaId);
    if (filtros.categoriaActivoId) params = params.set('categoriaActivoId', filtros.categoriaActivoId);
    if (filtros.activo !== undefined) params = params.set('activo', String(filtros.activo));
    return this.http.get<ModeloActivoList[]>(this.endpoint, { params });
  }

  getById(id: string): Observable<ModeloActivoDetalle> {
    return this.http.get<ModeloActivoDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: ModeloActivoCreate): Observable<ModeloActivoDetalle> {
    return this.http.post<ModeloActivoDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: ModeloActivoUpdate): Observable<ModeloActivoDetalle> {
    return this.http.put<ModeloActivoDetalle>(`${this.endpoint}/${id}`, dto);
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.endpoint}/${id}/estatus`, { activo });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
