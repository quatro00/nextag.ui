import {
    HttpClient,
    HttpParams,
} from '@angular/common/http';
import {
    inject,
    Injectable,
} from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
    ContratoAccionEstado,
    ContratoCancelar,
    ContratoDetalle,
    ContratoFiltros,
    ContratoGuardar,
    ContratoListado,
} from '../types/contrato.types';

@Injectable({
    providedIn: 'root',
})
export class ContratosService {

    private readonly http =
        inject(HttpClient);

    private readonly endpoint =
        `${inject(API_URL)}/contratos`;

    getAll(
        filtros: ContratoFiltros = {}
    ): Observable<ContratoListado> {

        const params =
            this.construirParametros(filtros);

        return this.http.get<ContratoListado>(
            this.endpoint,
            { params }
        );
    }

    getById(
        id: string
    ): Observable<ContratoDetalle> {

        return this.http.get<ContratoDetalle>(
            `${this.endpoint}/${id}`
        );
    }

    create(
        dto: ContratoGuardar
    ): Observable<ContratoDetalle> {

        return this.http.post<ContratoDetalle>(
            this.endpoint,
            dto
        );
    }

    update(
        id: string,
        dto: ContratoGuardar
    ): Observable<ContratoDetalle> {

        return this.http.put<ContratoDetalle>(
            `${this.endpoint}/${id}`,
            dto
        );
    }

    activar(
        id: string
    ): Observable<ContratoDetalle> {

        return this.cambiarEstado(
            id,
            'activar'
        );
    }

    suspender(
        id: string
    ): Observable<ContratoDetalle> {

        return this.cambiarEstado(
            id,
            'suspender'
        );
    }

    reanudar(
        id: string
    ): Observable<ContratoDetalle> {

        return this.cambiarEstado(
            id,
            'reanudar'
        );
    }

    cancelar(
        id: string,
        dto: ContratoCancelar
    ): Observable<ContratoDetalle> {

        return this.cambiarEstado(
            id,
            'cancelar',
            dto
        );
    }

    finalizar(
        id: string
    ): Observable<ContratoDetalle> {

        return this.cambiarEstado(
            id,
            'finalizar'
        );
    }

    delete(
        id: string
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.endpoint}/${id}`
        );
    }

    private cambiarEstado(
        id: string,
        accion: ContratoAccionEstado,
        body: ContratoCancelar | null = null
    ): Observable<ContratoDetalle> {

        return this.http.patch<ContratoDetalle>(
            `${this.endpoint}/${id}/${accion}`,
            body
        );
    }

    private construirParametros(
        filtros: ContratoFiltros
    ): HttpParams {

        let params = new HttpParams();

        const establecer = (
            clave: string,
            valor:
                | string
                | number
                | boolean
                | null
                | undefined
        ): void => {

            if (
                valor === undefined ||
                valor === null
            ) {
                return;
            }

            if (typeof valor === 'string') {

                const texto = valor.trim();

                if (!texto) {
                    return;
                }

                params = params.set(
                    clave,
                    texto
                );

                return;
            }

            params = params.set(
                clave,
                String(valor)
            );
        };

        establecer(
            'buscar',
            filtros.buscar
        );

        establecer(
            'tipoContratoId',
            filtros.tipoContratoId
        );

        establecer(
            'estadoContratoId',
            filtros.estadoContratoId
        );

        establecer(
            'clienteId',
            filtros.clienteId
        );

        establecer(
            'proveedorId',
            filtros.proveedorId
        );

        establecer(
            'activo',
            filtros.activo
        );

        establecer(
            'renovacionAutomatica',
            filtros.renovacionAutomatica
        );

        establecer(
            'moneda',
            filtros.moneda?.toUpperCase()
        );

        establecer(
            'fechaInicioDesde',
            filtros.fechaInicioDesde
        );

        establecer(
            'fechaInicioHasta',
            filtros.fechaInicioHasta
        );

        establecer(
            'fechaFinDesde',
            filtros.fechaFinDesde
        );

        establecer(
            'fechaFinHasta',
            filtros.fechaFinHasta
        );

        establecer(
            'vencidos',
            filtros.vencidos
        );

        establecer(
            'proximosAVencer',
            filtros.proximosAVencer
        );

        establecer(
            'sinFechaFin',
            filtros.sinFechaFin
        );

        establecer(
            'diasProximosAVencer',
            filtros.diasProximosAVencer
        );

        establecer(
            'pagina',
            filtros.pagina
        );

        establecer(
            'registrosPorPagina',
            filtros.registrosPorPagina
        );

        return params;
    }
}