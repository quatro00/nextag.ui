import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  ProveedorDetalle,
  ProveedorFiltros,
  ProveedorGuardar,
  ProveedorList,
} from '../types/proveedor.types';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL)}/proveedores`;

  getAll(filtros: ProveedorFiltros = {}): Observable<ProveedorList[]> {
    let params = new HttpParams();
    if (filtros.activo !== undefined) params = params.set('activo', String(filtros.activo));
    if (filtros.tipoProveedorId !== undefined) params = params.set('tipoProveedorId', String(filtros.tipoProveedorId));
    if (filtros.buscar?.trim()) params = params.set('buscar', filtros.buscar.trim());
    return this.http.get<ProveedorList[]>(this.endpoint, { params });
  }

  getById(id: string): Observable<ProveedorDetalle> {
    return this.http.get<ProveedorDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: ProveedorGuardar): Observable<ProveedorDetalle> {
    return this.http.post<ProveedorDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: ProveedorGuardar): Observable<ProveedorDetalle> {
    return this.http.put<ProveedorDetalle>(`${this.endpoint}/${id}`, dto);
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.endpoint}/${id}/estatus`, { activo });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
