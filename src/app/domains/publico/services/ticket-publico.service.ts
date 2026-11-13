import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import {
  CategoriaTicketPublica,
  TicketPublicoCrear,
  TicketPublicoResultado,
} from '../types/ticket-publico.types';

@Injectable({
  providedIn: 'root',
})
export class TicketPublicoService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/publico/etiquetas`;

  private url(tokenPublico: string): string {
    return `${this.endpoint}/${encodeURIComponent(tokenPublico)}`;
  }

  // ==========================================
  // CATEGORIAS PUBLICAS
  // ==========================================

  getCategorias(
    tokenPublico: string
  ): Observable<CategoriaTicketPublica[]> {

    return this.http.get<CategoriaTicketPublica[]>(
      `${this.url(tokenPublico)}/categorias-ticket`
    );
  }

  // ==========================================
  // REGISTRAR TICKET
  // ==========================================

  crear(
    tokenPublico: string,
    dto: TicketPublicoCrear
  ): Observable<TicketPublicoResultado> {

    return this.http.post<TicketPublicoResultado>(
      `${this.url(tokenPublico)}/tickets`,
      dto
    );
  }
}