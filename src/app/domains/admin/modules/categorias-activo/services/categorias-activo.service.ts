import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  CategoriaActivoCreate,
  CategoriaActivoDetalle,
  CategoriaActivoEstatus,
  CategoriaActivoList,
  CategoriaActivoUpdate,
} from '../types/categoria-activo.types';

@Injectable({
  providedIn: 'root',
})
export class CategoriasActivoService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/categorias-activo`;

  // ==========================================
  // LISTADO
  // ==========================================

  getAll(activo?: boolean): Observable<CategoriaActivoList[]> {
    const options =
      activo === undefined
        ? {}
        : { params: { activo: String(activo) } };

    return this.http.get<CategoriaActivoList[]>(
      this.endpoint,
      options
    );
  }

  // ==========================================
  // DETALLE
  // ==========================================

  getById(id: string): Observable<CategoriaActivoDetalle> {
    return this.http.get<CategoriaActivoDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  // ==========================================
  // CREAR
  // ==========================================

  create(
    dto: CategoriaActivoCreate
  ): Observable<CategoriaActivoDetalle> {
    return this.http.post<CategoriaActivoDetalle>(
      this.endpoint,
      dto
    );
  }

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  update(
    id: string,
    dto: CategoriaActivoUpdate
  ): Observable<CategoriaActivoDetalle> {
    return this.http.put<CategoriaActivoDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }

  // ==========================================
  // CAMBIAR ESTATUS
  // ==========================================

  updateStatus(
    id: string,
    activo: boolean
  ): Observable<{ message: string }> {
    const dto: CategoriaActivoEstatus = { activo };

    return this.http.patch<{ message: string }>(
      `${this.endpoint}/${id}/estatus`,
      dto
    );
  }

  // ==========================================
  // BAJA LOGICA
  // ==========================================

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.endpoint}/${id}`
    );
  }
}