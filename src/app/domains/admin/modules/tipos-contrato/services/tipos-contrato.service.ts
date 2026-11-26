import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  TipoContratoList,
  TipoContratoDetalle,
  TipoContratoGuardar,
  TipoContratoFiltros,
} from '../types/tipo-contrato.types';

@Injectable({
  providedIn: 'root',
})
export class TiposContratoService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/tipos-contrato`;

  getAll(
    filtros: TipoContratoFiltros = {}
  ): Observable<TipoContratoList[]> {

    let params = new HttpParams();

    if (filtros.activo !== undefined) {
      params = params.set(
        'activo',
        String(filtros.activo)
      );
    }

    if (filtros.buscar?.trim()) {
      params = params.set(
        'buscar',
        filtros.buscar.trim()
      );
    }

    return this.http.get<TipoContratoList[]>(
      this.endpoint,
      { params }
    );
  }

  getById(id: string): Observable<TipoContratoDetalle> {

    return this.http.get<TipoContratoDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  create(
    dto: TipoContratoGuardar
  ): Observable<TipoContratoDetalle> {

    return this.http.post<TipoContratoDetalle>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: TipoContratoGuardar
  ): Observable<TipoContratoDetalle> {

    return this.http.put<TipoContratoDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }

  updateStatus(
    id: string,
    activo: boolean
  ): Observable<{ message: string }> {

    return this.http.patch<{ message: string }>(
      `${this.endpoint}/${id}/estatus`,
      { activo }
    );
  }

  delete(id: string): Observable<void> {

    return this.http.delete<void>(
      `${this.endpoint}/${id}`
    );
  }
}