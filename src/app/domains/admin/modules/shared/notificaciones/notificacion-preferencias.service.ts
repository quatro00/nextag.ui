import {
    HttpClient,
} from '@angular/common/http';

import {
    inject,
    Injectable,
} from '@angular/core';

import {
    Observable,
} from 'rxjs';

import {
    API_URL,
} from '@/app/core/config/api.config';

import {
    NotificacionPreferencia,
    NotificacionPreferenciaGuardar,
} from './notificacion-preferencias.types';


@Injectable({
    providedIn: 'root',
})
export class NotificacionPreferenciasService {

    private readonly http = inject(HttpClient);

    private readonly endpoint =
        `${inject(API_URL)}/notificaciones/preferencias`;

    // ==========================================
    // CONSULTAR PREFERENCIAS
    // ==========================================

    obtener(): Observable<NotificacionPreferencia[]> {

        return this.http.get<NotificacionPreferencia[]>(
            this.endpoint
        );
    }

    // ==========================================
    // GUARDAR PREFERENCIAS
    // ==========================================

    guardar(
        eventoId: number,
        dto: NotificacionPreferenciaGuardar
    ): Observable<NotificacionPreferencia> {

        return this.http.put<NotificacionPreferencia>(
            `${this.endpoint}/${eventoId}`,
            dto
        );
    }
}