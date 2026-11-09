import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  ActivoMovimiento,
  ActivoMovimientoCrear,
  ActivoMovimientoFiltro,
  ActivoMovimientoPagina,
  ActivoSituacion,
  TipoMovimientoActivo,
} from '../types/activo-movimiento.types';

@Injectable({
  providedIn: 'root',
})
export class ActivoMovimientosService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/activo-movimientos`;

  getAll(
    filtros: ActivoMovimientoFiltro = {}
  ): Observable<ActivoMovimientoPagina> {

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

    return this.http.get<ActivoMovimientoPagina>(
      this.endpoint,
      { params }
    );
  }

  getById(
    id: string
  ): Observable<ActivoMovimiento> {

    return this.http.get<ActivoMovimiento>(
      `${this.endpoint}/${id}`
    );
  }

  getTipos(): Observable<TipoMovimientoActivo[]> {

    return this.http.get<TipoMovimientoActivo[]>(
      `${this.endpoint}/tipos`
    );
  }

  getHistorialActivo(
    activoId: string
  ): Observable<ActivoMovimiento[]> {

    return this.http.get<ActivoMovimiento[]>(
      `${this.endpoint}/activo/${activoId}/historial`
    );
  }

  getSituacionActivo(
    activoId: string
  ): Observable<ActivoSituacion> {

    return this.http.get<ActivoSituacion>(
      `${this.endpoint}/activo/${activoId}/situacion`
    );
  }

  create(
    dto: ActivoMovimientoCrear
  ): Observable<ActivoMovimiento> {

    return this.http.post<ActivoMovimiento>(
      this.endpoint,
      dto
    );
  }
}