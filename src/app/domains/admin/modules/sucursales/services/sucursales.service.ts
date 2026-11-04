import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  SucursalCreate,
  SucursalDetalle,
  SucursalEstatus,
  SucursalList,
  SucursalUpdate,
} from '../types/sucursal.types';

@Injectable({
  providedIn: 'root',
})
export class SucursalesService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/sucursales`;

  getAll(activo?: boolean): Observable<SucursalList[]> {
    const options = activo === undefined
      ? {}
      : { params: { activo: String(activo) } };

    return this.http.get<SucursalList[]>(this.endpoint, options);
  }

  getById(id: string): Observable<SucursalDetalle> {
    return this.http.get<SucursalDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  create(dto: SucursalCreate): Observable<SucursalDetalle> {
    return this.http.post<SucursalDetalle>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: SucursalUpdate
  ): Observable<SucursalDetalle> {
    return this.http.put<SucursalDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }

  updateStatus(
    id: string,
    activo: boolean
  ): Observable<{ message: string }> {
    const dto: SucursalEstatus = { activo };

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