import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';
import {
  EquipoSoporteList,
  EquipoSoporteDetalle,
  EquipoSoporteGuardar,
  EquipoSoporteFiltros,
} from '../types/equipo-soporte.types';

@Injectable({
  providedIn: 'root',
})
export class EquiposSoporteService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/equipos-soporte`;

  getAll(
    filtros: EquipoSoporteFiltros = {}
  ): Observable<EquipoSoporteList[]> {

    let params = new HttpParams();

    if (filtros.activo !== undefined) {
      params = params.set(
        'activo',
        String(filtros.activo)
      );
    }

    if (filtros.tipo) {
      params = params.set(
        'tipo',
        filtros.tipo
      );
    }

    if (filtros.buscar?.trim()) {
      params = params.set(
        'buscar',
        filtros.buscar.trim()
      );
    }

    return this.http.get<EquipoSoporteList[]>(
      this.endpoint,
      { params }
    );
  }

  getById(
    id: string
  ): Observable<EquipoSoporteDetalle> {

    return this.http.get<EquipoSoporteDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  create(
    dto: EquipoSoporteGuardar
  ): Observable<EquipoSoporteDetalle> {

    return this.http.post<EquipoSoporteDetalle>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: EquipoSoporteGuardar
  ): Observable<EquipoSoporteDetalle> {

    return this.http.put<EquipoSoporteDetalle>(
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