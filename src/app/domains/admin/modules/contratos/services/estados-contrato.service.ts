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
    EstadoContrato,
    EstadoContratoFiltros,
} from '../types/estado-contrato.types';

@Injectable({
    providedIn: 'root',
})
export class EstadosContratoService {

    private readonly http =
        inject(HttpClient);

    private readonly endpoint =
        `${inject(API_URL)}/estados-contrato`;

    getAll(
        filtros: EstadoContratoFiltros = {}
    ): Observable<EstadoContrato[]> {

        let params = new HttpParams();

        if (filtros.activo !== undefined) {

            params = params.set(
                'activo',
                String(filtros.activo)
            );
        }

        return this.http.get<EstadoContrato[]>(
            this.endpoint,
            { params }
        );
    }
}