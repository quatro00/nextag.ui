import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  ProveedorContacto,
  ProveedorContactoGuardar,
} from '../types/proveedor-contacto.types';

@Injectable({ providedIn: 'root' })
export class ProveedorContactosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL)}/proveedores`;

  private url(proveedorId: string): string {
    return `${this.endpoint}/${proveedorId}/contactos`;
  }

  getAll(proveedorId: string, activo?: boolean): Observable<ProveedorContacto[]> {
    let params = new HttpParams();
    if (activo !== undefined) params = params.set('activo', String(activo));
    return this.http.get<ProveedorContacto[]>(this.url(proveedorId), { params });
  }

  getById(proveedorId: string, contactoId: string): Observable<ProveedorContacto> {
    return this.http.get<ProveedorContacto>(`${this.url(proveedorId)}/${contactoId}`);
  }

  create(proveedorId: string, dto: ProveedorContactoGuardar): Observable<ProveedorContacto> {
    return this.http.post<ProveedorContacto>(this.url(proveedorId), dto);
  }

  update(proveedorId: string, contactoId: string, dto: ProveedorContactoGuardar): Observable<ProveedorContacto> {
    return this.http.put<ProveedorContacto>(`${this.url(proveedorId)}/${contactoId}`, dto);
  }

  updateStatus(proveedorId: string, contactoId: string, activo: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.url(proveedorId)}/${contactoId}/estatus`, { activo });
  }

  delete(proveedorId: string, contactoId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(proveedorId)}/${contactoId}`);
  }
}
