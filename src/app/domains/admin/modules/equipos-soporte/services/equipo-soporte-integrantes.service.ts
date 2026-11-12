import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import {
  EquipoSoporteIntegrante,
  EquipoSoporteIntegranteCrear,
  UsuarioDisponibleSoporte,
} from '../types/equipo-soporte-integrante.types';

@Injectable({
  providedIn: 'root',
})
export class EquipoSoporteIntegrantesService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = inject(API_URL);

  private endpoint(equipoId: string): string {

    return `${this.apiUrl}/equipos-soporte/${equipoId}/integrantes`;
  }

  getAll(
    equipoId: string,
    activo?: boolean
  ): Observable<EquipoSoporteIntegrante[]> {

    let params = new HttpParams();

    if (activo !== undefined) {
      params = params.set(
        'activo',
        String(activo)
      );
    }

    return this.http.get<EquipoSoporteIntegrante[]>(
      this.endpoint(equipoId),
      { params }
    );
  }

  getDisponibles(
    equipoId: string,
    buscar?: string
  ): Observable<UsuarioDisponibleSoporte[]> {

    let params = new HttpParams();

    if (buscar?.trim()) {
      params = params.set(
        'buscar',
        buscar.trim()
      );
    }

    return this.http.get<UsuarioDisponibleSoporte[]>(
      `${this.endpoint(equipoId)}/disponibles`,
      { params }
    );
  }

  getById(
    equipoId: string,
    id: string
  ): Observable<EquipoSoporteIntegrante> {

    return this.http.get<EquipoSoporteIntegrante>(
      `${this.endpoint(equipoId)}/${id}`
    );
  }

  create(
    equipoId: string,
    dto: EquipoSoporteIntegranteCrear
  ): Observable<EquipoSoporteIntegrante> {

    return this.http.post<EquipoSoporteIntegrante>(
      this.endpoint(equipoId),
      dto
    );
  }

  updateStatus(
    equipoId: string,
    id: string,
    activo: boolean
  ): Observable<{ message: string }> {

    return this.http.patch<{ message: string }>(
      `${this.endpoint(equipoId)}/${id}/estatus`,
      { activo }
    );
  }

  delete(
    equipoId: string,
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.endpoint(equipoId)}/${id}`
    );
  }
}