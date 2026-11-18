import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@/app/core/config/api.config';

import { TicketAdjunto } from
    '../types/ticket-adjunto.types';

@Injectable({
    providedIn: 'root',
})
export class TicketAdjuntosService {

    private readonly http = inject(HttpClient);

    private readonly endpoint =
        `${inject(API_URL)}/tickets`;

    // ==========================================
    // ENDPOINT
    // ==========================================

    private url(ticketId: string): string {
        return `${this.endpoint}/${ticketId}/adjuntos`;
    }

    // ==========================================
    // LISTAR
    // ==========================================

    getAll(
        ticketId: string
    ): Observable<TicketAdjunto[]> {

        return this.http.get<TicketAdjunto[]>(
            this.url(ticketId)
        );
    }

    // ==========================================
    // SUBIR ARCHIVO
    // ==========================================

    subir(
        ticketId: string,
        archivo: File,
        visibleSolicitante: boolean
    ): Observable<TicketAdjunto> {

        const formData = new FormData();

        // ======================================
        // ARCHIVO
        // ======================================

        formData.append(
            'archivo',
            archivo,
            archivo.name
        );

        // ======================================
        // VISIBILIDAD
        // ======================================

        formData.append(
            'visibleSolicitante',
            String(visibleSolicitante)
        );

        // ======================================
        // PETICION
        // ======================================

        return this.http.post<TicketAdjunto>(
            this.url(ticketId),
            formData
        );
    }

    // ==========================================
    // DESCARGAR ARCHIVO
    // ==========================================

    descargar(
        ticketId: string,
        archivoId: string
    ): Observable<Blob> {

        return this.http.get(
            `${this.url(ticketId)}/${archivoId}`,
            {
                responseType: 'blob'
            }
        );
    }

    // ==========================================
    // ELIMINAR ARCHIVO
    // ==========================================

    eliminar(
        ticketId: string,
        archivoId: string
    ): Observable<{ message: string }> {

        return this.http.delete<{ message: string }>(
            `${this.url(ticketId)}/${archivoId}`
        );
    }
}