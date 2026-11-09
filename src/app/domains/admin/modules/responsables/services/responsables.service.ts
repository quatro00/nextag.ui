import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  Responsable,
  ResponsableFiltro,
  ResponsableGuardar,
  ResponsablePagina,
} from '../types/responsable.types';

@Injectable({
  providedIn: 'root',
})
export class ResponsablesService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/responsables`;

  getAll(
    filtros: ResponsableFiltro = {}
  ): Observable<ResponsablePagina> {

    let params = new HttpParams();

    if (filtros.buscar?.trim()) {
      params = params.set(
        'buscar',
        filtros.buscar.trim()
      );
    }

    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }

    if (filtros.activo !== undefined) {
      params = params.set(
        'activo',
        String(filtros.activo)
      );
    }

    if (filtros.sucursalId) {
      params = params.set(
        'sucursalId',
        filtros.sucursalId
      );
    }

    if (filtros.areaResponsableId) {
      params = params.set(
        'areaResponsableId',
        filtros.areaResponsableId
      );
    }

    params = params.set(
      'pagina',
      String(filtros.pagina ?? 1)
    );

    params = params.set(
      'tamanoPagina',
      String(filtros.tamanoPagina ?? 20)
    );

    return this.http.get<ResponsablePagina>(
      this.endpoint,
      { params }
    );
  }

  getById(id: string): Observable<Responsable> {
    return this.http.get<Responsable>(
      `${this.endpoint}/${id}`
    );
  }

  create(
    dto: ResponsableGuardar
  ): Observable<Responsable> {

    return this.http.post<Responsable>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: ResponsableGuardar
  ): Observable<Responsable> {

    return this.http.put<Responsable>(
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