import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  ClienteDetalle,
  ClienteFiltros,
  ClienteGuardar,
  ClienteList,
} from '../types/cliente.types';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/clientes`;

  getAll(
    filtros: ClienteFiltros = {}
  ): Observable<ClienteList[]> {

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

    return this.http.get<ClienteList[]>(
      this.endpoint,
      { params }
    );
  }

  getById(id: string): Observable<ClienteDetalle> {

    return this.http.get<ClienteDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  create(
    dto: ClienteGuardar
  ): Observable<ClienteDetalle> {

    return this.http.post<ClienteDetalle>(
      this.endpoint,
      dto
    );
  }

  update(
    id: string,
    dto: ClienteGuardar
  ): Observable<ClienteDetalle> {

    return this.http.put<ClienteDetalle>(
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