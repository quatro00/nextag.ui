import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { EtiquetaPublica } from '../types/etiqueta-publica.types';

@Injectable({
  providedIn: 'root',
})
export class EtiquetaPublicaService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${inject(API_URL)}/publico/etiquetas`;

  consultar(
    tokenPublico: string,
    origen?: string | null
  ): Observable<EtiquetaPublica> {

    let params = new HttpParams();

    if (origen === 'NFC' || origen === 'QR') {
      params = params.set('origen', origen);
    }

    return this.http.get<EtiquetaPublica>(
      `${this.endpoint}/${encodeURIComponent(tokenPublico)}`,
      { params }
    );
  }
}