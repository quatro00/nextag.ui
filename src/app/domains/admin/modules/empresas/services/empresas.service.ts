import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { EmpresaCreate, EmpresaDetalle, EmpresaEstatus, EmpresaList, EmpresaUpdate } from '../types/empresa.types';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);
  private readonly endpoint = `${this.apiUrl}/administrador/empresas`;

  getAll(): Observable<EmpresaList[]> {
    return this.http.get<EmpresaList[]>(this.endpoint);
  }

  getById(id: string): Observable<EmpresaDetalle> {
    return this.http.get<EmpresaDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: EmpresaCreate): Observable<EmpresaDetalle> {
    return this.http.post<EmpresaDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: EmpresaUpdate): Observable<EmpresaDetalle> {
    return this.http.put<EmpresaDetalle>(`${this.endpoint}/${id}`, dto);
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    const dto: EmpresaEstatus = { activo };
    return this.http.patch<{ message: string }>(`${this.endpoint}/${id}/estatus`, dto);
  }
}