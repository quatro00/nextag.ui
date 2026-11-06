import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { TipoProveedor } from '../types/proveedor.types';

@Injectable({ providedIn: 'root' })
export class TiposProveedorService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL)}/tipos-proveedor`;

  getAll(): Observable<TipoProveedor[]> {
    return this.http.get<TipoProveedor[]>(this.endpoint);
  }
}
