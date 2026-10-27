import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { DepartamentoCreate, DepartamentoDetalle, DepartamentoEstatus, DepartamentoList, DepartamentoUpdate } from '../../departamentos/types/departamento.types';


@Injectable({
  providedIn: 'root',
})
export class DepartamentosService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/administrador/departamentos`;

  getAll(areaId?: string): Observable<DepartamentoList[]> {
    let params = new HttpParams();

    if (areaId)
      params = params.set('areaId', areaId);

    return this.http.get<DepartamentoList[]>(this.endpoint, { params });
  }

  getById(id: string): Observable<DepartamentoDetalle> {
    return this.http.get<DepartamentoDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: DepartamentoCreate): Observable<DepartamentoDetalle> {
    return this.http.post<DepartamentoDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: DepartamentoUpdate): Observable<DepartamentoDetalle> {
    return this.http.put<DepartamentoDetalle>(`${this.endpoint}/${id}`, dto);
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    const dto: DepartamentoEstatus = { activo };

    return this.http.patch<{ message: string }>(
      `${this.endpoint}/${id}/estatus`,
      dto
    );
  }
}