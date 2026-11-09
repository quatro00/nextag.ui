import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  ActivoAsignacion,
  ActivoAsignacionCrear,
  ActivoAsignacionDevolver,
  ActivoAsignacionReasignar,
  ActivoAsignacionFiltro,
  ActivoAsignacionPagina,
  ActivosSinAsignarPagina,
} from '../types/activo-asignacion.types';

@Injectable({
  providedIn: 'root',
})
export class ActivoAsignacionesService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/activo-asignaciones`;

  getAll(
    filtros: ActivoAsignacionFiltro = {}
  ): Observable<ActivoAsignacionPagina> {

    let params = new HttpParams();

    if (filtros.buscar?.trim()) {
      params = params.set('buscar', filtros.buscar.trim());
    }

    if (filtros.activoId) {
      params = params.set('activoId', filtros.activoId);
    }

    if (filtros.responsableId) {
      params = params.set('responsableId', filtros.responsableId);
    }

    if (filtros.sucursalId) {
      params = params.set('sucursalId', filtros.sucursalId);
    }

    if (filtros.tipoResponsable) {
      params = params.set(
        'tipoResponsable',
        filtros.tipoResponsable
      );
    }

    if (filtros.vigente !== undefined) {
      params = params.set(
        'vigente',
        String(filtros.vigente)
      );
    }

    if (filtros.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde);
    }

    if (filtros.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta);
    }

    params = params.set(
      'pagina',
      String(filtros.pagina ?? 1)
    );

    params = params.set(
      'tamanoPagina',
      String(filtros.tamanoPagina ?? 20)
    );

    return this.http.get<ActivoAsignacionPagina>(
      this.endpoint,
      { params }
    );
  }

  getById(id: string): Observable<ActivoAsignacion> {
    return this.http.get<ActivoAsignacion>(
      `${this.endpoint}/${id}`
    );
  }

  getActivosSinAsignar(
    buscar = '',
    sucursalId?: string,
    pagina = 1,
    tamanoPagina = 20
  ): Observable<ActivosSinAsignarPagina> {

    let params = new HttpParams()
      .set('pagina', String(pagina))
      .set('tamanoPagina', String(tamanoPagina));

    if (buscar.trim()) {
      params = params.set('buscar', buscar.trim());
    }

    if (sucursalId) {
      params = params.set('sucursalId', sucursalId);
    }

    return this.http.get<ActivosSinAsignarPagina>(
      `${this.endpoint}/activos-sin-asignar`,
      { params }
    );
  }

  getHistorialActivo(
    activoId: string
  ): Observable<ActivoAsignacion[]> {

    return this.http.get<ActivoAsignacion[]>(
      `${this.endpoint}/activo/${activoId}/historial`
    );
  }

  getHistorialResponsable(
    responsableId: string
  ): Observable<ActivoAsignacion[]> {

    return this.http.get<ActivoAsignacion[]>(
      `${this.endpoint}/responsable/${responsableId}/historial`
    );
  }

  getVigenteActivo(
    activoId: string
  ): Observable<ActivoAsignacion> {

    return this.http.get<ActivoAsignacion>(
      `${this.endpoint}/activo/${activoId}/vigente`
    );
  }

  create(
    dto: ActivoAsignacionCrear
  ): Observable<ActivoAsignacion> {

    return this.http.post<ActivoAsignacion>(
      this.endpoint,
      dto
    );
  }

  devolver(
    id: string,
    dto: ActivoAsignacionDevolver
  ): Observable<ActivoAsignacion> {

    return this.http.post<ActivoAsignacion>(
      `${this.endpoint}/${id}/devolver`,
      dto
    );
  }

  reasignar(
    id: string,
    dto: ActivoAsignacionReasignar
  ): Observable<ActivoAsignacion> {

    return this.http.post<ActivoAsignacion>(
      `${this.endpoint}/${id}/reasignar`,
      dto
    );
  }
}