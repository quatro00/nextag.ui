import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  EtiquetaConfiguracion,
  EtiquetaConfiguracionGuardar,
} from '../types/etiqueta-configuracion.types';

@Injectable({
  providedIn: 'root',
})
export class EtiquetaConfiguracionService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/etiquetas/configuracion`;

  // ==========================================
  // CONSULTAR CONFIGURACION
  // ==========================================

  get(): Observable<EtiquetaConfiguracion> {

    return this.http.get<EtiquetaConfiguracion>(
      this.endpoint
    );
  }

  // ==========================================
  // GUARDAR CONFIGURACION
  // ==========================================

  guardar(
    dto: EtiquetaConfiguracionGuardar
  ): Observable<EtiquetaConfiguracion> {

    return this.http.put<EtiquetaConfiguracion>(
      this.endpoint,
      dto
    );
  }
}