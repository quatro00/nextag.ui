import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  UbicacionCreate,
  UbicacionDetalle,
  UbicacionEstatus,
  UbicacionList,
  UbicacionUpdate,
} from '../types/ubicacion.types';

@Injectable({
  providedIn: 'root',
})
export class UbicacionesService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/ubicaciones`;

  // ==========================================
  // LISTADO
  // ==========================================

  getAll(
    sucursalId?: string,
    activo?: boolean
  ): Observable<UbicacionList[]> {

    const params: Record<string, string> = {};

    if (sucursalId) {
      params['sucursalId'] = sucursalId;
    }

    if (activo !== undefined) {
      params['activo'] = String(activo);
    }

    return this.http.get<UbicacionList[]>(
      this.endpoint,
      { params }
    );
  }

  // ==========================================
  // DETALLE
  // ==========================================

  getById(id: string): Observable<UbicacionDetalle> {
    return this.http.get<UbicacionDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  // ==========================================
  // CREAR
  // ==========================================

  create(
    dto: UbicacionCreate
  ): Observable<UbicacionDetalle> {

    return this.http.post<UbicacionDetalle>(
      this.endpoint,
      dto
    );
  }

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  update(
    id: string,
    dto: UbicacionUpdate
  ): Observable<UbicacionDetalle> {

    return this.http.put<UbicacionDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }

  // ==========================================
  // ESTATUS
  // ==========================================

  updateStatus(
    id: string,
    activo: boolean
  ): Observable<{ message: string }> {

    const dto: UbicacionEstatus = { activo };

    return this.http.patch<{ message: string }>(
      `${this.endpoint}/${id}/estatus`,
      dto
    );
  }

  // ==========================================
  // ELIMINACION LOGICA
  // ==========================================

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.endpoint}/${id}`
    );
  }
}