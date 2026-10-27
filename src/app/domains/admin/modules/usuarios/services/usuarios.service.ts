import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import {
  UsuarioCreate,
  UsuarioDetalle,
  UsuarioEstatus,
  UsuarioList,
  UsuarioRoles,
  UsuarioUpdate,
} from '../types/usuario.types';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/administrador/usuarios`;

  getAll(): Observable<UsuarioList[]> {
    return this.http.get<UsuarioList[]>(this.endpoint);
  }

  getById(id: string): Observable<UsuarioDetalle> {
    return this.http.get<UsuarioDetalle>(`${this.endpoint}/${id}`);
  }

  create(dto: UsuarioCreate): Observable<UsuarioDetalle> {
    return this.http.post<UsuarioDetalle>(this.endpoint, dto);
  }

  update(id: string, dto: UsuarioUpdate): Observable<UsuarioDetalle> {
    return this.http.put<UsuarioDetalle>(
      `${this.endpoint}/${id}`,
      dto
    );
  }

  updateStatus(id: string, activo: boolean): Observable<{ message: string }> {
    const dto: UsuarioEstatus = { activo };

    return this.http.patch<{ message: string }>(
      `${this.endpoint}/${id}/estatus`,
      dto
    );
  }

  updateRoles(id: string, roles: string[]): Observable<UsuarioDetalle> {
    const dto: UsuarioRoles = { roles };

    return this.http.put<UsuarioDetalle>(
      `${this.endpoint}/${id}/roles`,
      dto
    );
  }
}