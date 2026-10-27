import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  AreaCreate,
  AreaDetalle,
  AreaEstatus,
  AreaList,
  AreaUpdate,
} from '../types/area.types';

@Injectable({
  providedIn: 'root',
})
export class AreasService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/administrador/areas`;

  getAll(): Observable<AreaList[]> {
    return this.http.get<AreaList[]>(this.endpoint);
  }

  getById(id: string): Observable<AreaDetalle> {
    return this.http.get<AreaDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: AreaCreate): Observable<AreaDetalle> {
    return this.http.post<AreaDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: AreaUpdate): Observable<AreaDetalle> {
    return this.http.put<AreaDetalle>(`${this.endpoint}/${id}`, dto);
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    const dto: AreaEstatus = { activo };
    return this.http.patch<{ message: string }>(`${this.endpoint}/${id}/estatus`, dto);
  }
}