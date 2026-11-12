import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import {
  TicketList,
  TicketDetalle,
  TicketGuardar,
  TicketFiltro,
  TicketPaginado,
  TicketCatalogo,
} from '../types/ticket.types';

@Injectable({
  providedIn: 'root',
})
export class TicketsService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/tickets`;

  // ==========================================
  // LISTADO
  // ==========================================

  getAll(
    filtros: TicketFiltro = {}
  ): Observable<TicketPaginado> {

    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (
        valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== ''
      ) {
        params = params.set(clave, String(valor));
      }
    }

    return this.http.get<TicketPaginado>(
      this.endpoint,
      { params }
    );
  }

  // ==========================================
  // DETALLE
  // ==========================================

  getById(
    id: string
  ): Observable<TicketDetalle> {

    return this.http.get<TicketDetalle>(
      `${this.endpoint}/${id}`
    );
  }

  // ==========================================
  // TICKETS POR ACTIVO
  // ==========================================

  getByActivo(
    activoId: string
  ): Observable<TicketList[]> {

    return this.http.get<TicketList[]>(
      `${this.endpoint}/activo/${activoId}`
    );
  }

  // ==========================================
  // ESTADOS
  // ==========================================

  getEstados(): Observable<TicketCatalogo[]> {

    return this.http.get<TicketCatalogo[]>(
      `${this.endpoint}/estados`
    );
  }

  // ==========================================
  // PRIORIDADES
  // ==========================================

  getPrioridades(): Observable<TicketCatalogo[]> {

    return this.http.get<TicketCatalogo[]>(
      `${this.endpoint}/prioridades`
    );
  }

  // ==========================================
  // CREAR
  // ==========================================

  create(
    dto: TicketGuardar
  ): Observable<TicketDetalle> {

    return this.http.post<TicketDetalle>(
      this.endpoint,
      dto
    );
  }

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  update(
    id: string,
    dto: TicketGuardar
  ): Observable<TicketDetalle> {

    return this.http.put<TicketDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }
}