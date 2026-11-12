import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import { TicketDetalle } from '../types/ticket.types';

import {
  TicketAsignacion,
  TicketAsignar,
  TicketReasignar,
  TicketEstadoHistorial,
  TicketSeguimiento,
} from '../types/ticket-operacion.types';

@Injectable({
  providedIn: 'root',
})
export class TicketOperacionService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/tickets`;

  private url(id: string): string {
    return `${this.endpoint}/${id}`;
  }

  // ==========================================
  // ASIGNACIONES
  // ==========================================

  getAsignacionVigente(
    id: string
  ): Observable<TicketAsignacion | null> {

    return this.http.get<TicketAsignacion | null>(
      `${this.url(id)}/asignacion-vigente`
    );
  }

  getHistorialAsignaciones(
    id: string
  ): Observable<TicketAsignacion[]> {

    return this.http.get<TicketAsignacion[]>(
      `${this.url(id)}/historial-asignaciones`
    );
  }

  asignar(
    id: string,
    dto: TicketAsignar
  ): Observable<TicketAsignacion> {

    return this.http.post<TicketAsignacion>(
      `${this.url(id)}/asignaciones`,
      dto
    );
  }

  reasignar(
    id: string,
    dto: TicketReasignar
  ): Observable<TicketAsignacion> {

    return this.http.post<TicketAsignacion>(
      `${this.url(id)}/reasignaciones`,
      dto
    );
  }

  // ==========================================
  // ESTADOS
  // ==========================================

  getHistorialEstados(
    id: string
  ): Observable<TicketEstadoHistorial[]> {

    return this.http.get<TicketEstadoHistorial[]>(
      `${this.url(id)}/historial-estados`
    );
  }

  iniciar(
    id: string
  ): Observable<TicketDetalle> {

    return this.http.patch<TicketDetalle>(
      `${this.url(id)}/iniciar`,
      {}
    );
  }

  resolver(
    id: string,
    solucion: string
  ): Observable<TicketDetalle> {

    return this.http.patch<TicketDetalle>(
      `${this.url(id)}/resolver`,
      { solucion }
    );
  }

  cerrar(
    id: string
  ): Observable<TicketDetalle> {

    return this.http.patch<TicketDetalle>(
      `${this.url(id)}/cerrar`,
      {}
    );
  }

  reabrir(
    id: string,
    motivo: string
  ): Observable<TicketDetalle> {

    return this.http.patch<TicketDetalle>(
      `${this.url(id)}/reabrir`,
      { motivo }
    );
  }

  cancelar(
    id: string,
    motivo: string
  ): Observable<TicketDetalle> {

    return this.http.patch<TicketDetalle>(
      `${this.url(id)}/cancelar`,
      { motivo }
    );
  }

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================

  getSeguimientos(
    id: string
  ): Observable<TicketSeguimiento[]> {

    return this.http.get<TicketSeguimiento[]>(
      `${this.url(id)}/seguimientos`
    );
  }

  agregarComentario(
    id: string,
    comentario: string
  ): Observable<TicketSeguimiento> {

    return this.http.post<TicketSeguimiento>(
      `${this.url(id)}/comentarios`,
      { comentario }
    );
  }

  agregarNotaInterna(
    id: string,
    comentario: string
  ): Observable<TicketSeguimiento> {

    return this.http.post<TicketSeguimiento>(
      `${this.url(id)}/notas-internas`,
      { comentario }
    );
  }

  // ==========================================
  // BANDEJAS
  // ==========================================

  getMisTickets() {
    return this.http.get(
      `${this.endpoint}/mis-tickets`
    );
  }

  getTicketsMisEquipos() {
    return this.http.get(
      `${this.endpoint}/mis-equipos`
    );
  }
}