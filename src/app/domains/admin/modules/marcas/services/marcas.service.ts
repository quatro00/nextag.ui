import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { MarcaCreate, MarcaDetalle, MarcaList, MarcaUpdate } from '../types/marca.types';

@Injectable({ providedIn: 'root' })
export class MarcasService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL)}/marcas`;

  getAll(activo?: boolean): Observable<MarcaList[]> {
    const options = activo === undefined ? {} : { params: { activo: String(activo) } };
    return this.http.get<MarcaList[]>(this.endpoint, options);
  }

  getById(id: string): Observable<MarcaDetalle> {
    return this.http.get<MarcaDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: MarcaCreate): Observable<MarcaDetalle> {
    return this.http.post<MarcaDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: MarcaUpdate): Observable<MarcaDetalle> {
    return this.http.put<MarcaDetalle>(`${this.endpoint}/${id}`, dto);
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.endpoint}/${id}/estatus`, { activo });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
