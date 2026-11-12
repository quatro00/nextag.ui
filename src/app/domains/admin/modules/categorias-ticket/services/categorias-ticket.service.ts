import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import {
  CategoriaTicketList,
  CategoriaTicketDetalle,
  CategoriaTicketGuardar,
  CategoriaTicketFiltros,
} from '../types/categoria-ticket.types';

@Injectable({
  providedIn: 'root',
})
export class CategoriasTicketService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/categorias-ticket`;

  getAll(
    filtros: CategoriaTicketFiltros = {}
  ): Observable<CategoriaTicketList[]> {

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

    return this.http.get<CategoriaTicketList[]>(
      this.endpoint,
      { params }
    );
  }

  getById(
    id: string
  ): Observable<CategoriaTicketDetalle> {

    return this.http.get<CategoriaTicketDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  create(
    dto: CategoriaTicketGuardar
  ): Observable<CategoriaTicketDetalle> {

    return this.http.post<CategoriaTicketDetalle>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: CategoriaTicketGuardar
  ): Observable<CategoriaTicketDetalle> {

    return this.http.put<CategoriaTicketDetalle>(
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