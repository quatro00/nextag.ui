import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import {
    Notificacion,
    NotificacionConsulta,
    NotificacionPaginado,
    NotificacionContador,
} from './notificaciones.types';

@Injectable({
    providedIn: 'root',
})
export class NotificacionesService {

    private readonly http = inject(HttpClient);

    private readonly endpoint =
        `${inject(API_URL)}/notificaciones`;

    // ==========================================
    // LISTAR NOTIFICACIONES
    // ==========================================

    obtener(
        consulta: NotificacionConsulta = {}
    ): Observable<NotificacionPaginado> {

        let params = new HttpParams()
            .set('pagina', consulta.pagina ?? 1)
            .set('tamanoPagina', consulta.tamanoPagina ?? 10);

        if (consulta.soloNoLeidas !== undefined) {
            params = params.set(
                'soloNoLeidas',
                consulta.soloNoLeidas
            );
        }

        return this.http.get<NotificacionPaginado>(
            this.endpoint,
            { params }
        );
    }

    // ==========================================
    // CONTADOR DE NO LEIDAS
    // ==========================================

    contarNoLeidas(): Observable<NotificacionContador> {

        return this.http.get<NotificacionContador>(
            `${this.endpoint}/no-leidas`
        );
    }

    // ==========================================
    // MARCAR UNA COMO LEIDA
    // ==========================================

    marcarLeida(
        id: string
    ): Observable<{ message: string }> {

        return this.http.put<{ message: string }>(
            `${this.endpoint}/${id}/leer`,
            {}
        );
    }

    // ==========================================
    // MARCAR TODAS COMO LEIDAS
    // ==========================================

    marcarTodasLeidas(): Observable<{
        message: string;
        actualizadas: number;
    }> {

        return this.http.put<{
            message: string;
            actualizadas: number;
        }>(
            `${this.endpoint}/leer-todas`,
            {}
        );
    }
}