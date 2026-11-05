import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  TipoUbicacionCreate,
  TipoUbicacionDetalle,
  TipoUbicacionEstatus,
  TipoUbicacionList,
  TipoUbicacionUpdate,
} from '../types/tipo-ubicacion.types';

@Injectable({
  providedIn: 'root',
})
export class TiposUbicacionService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/tipos-ubicacion`;

  getAll(activo?: boolean): Observable<TipoUbicacionList[]> {
    const options =
      activo === undefined
        ? {}
        : { params: { activo: String(activo) } };

    return this.http.get<TipoUbicacionList[]>(
      this.endpoint,
      options
    );
  }

  getById(id: string): Observable<TipoUbicacionDetalle> {
    return this.http.get<TipoUbicacionDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  create(
    dto: TipoUbicacionCreate
  ): Observable<TipoUbicacionDetalle> {
    return this.http.post<TipoUbicacionDetalle>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: TipoUbicacionUpdate
  ): Observable<TipoUbicacionDetalle> {
    return this.http.put<TipoUbicacionDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }

  updateStatus(
    id: string,
    activo: boolean
  ): Observable<{ message: string }> {
    const dto: TipoUbicacionEstatus = { activo };

    return this.http.patch<{ message: string }>(
      `${this.endpoint}/${id}/estatus`,
      dto
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.endpoint}/${id}`
    );
  }
}