import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '@/app/core/config/api.config';
import { LocalStorage } from '@/app/core/local-storage';
import { AuthService } from '@/app/domains/auth/services/auth.services';

export interface EmpresaDisponible {
  id: string;
  clave: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class EmpresaContextoService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);
  private storage = inject(LocalStorage);
  private auth = inject(AuthService);

  readonly empresas = signal<EmpresaDisponible[]>([]);
  readonly seleccionada = signal<EmpresaDisponible | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  get empresaId(): string | null {
    return this.seleccionada()?.id ?? null;
  }

  async cargar(): Promise<void> {
    const usuarioId = this.auth.user()?.id;
    if (!usuarioId) {
      this.limpiar();
      return;
    }

    this.cargando.set(true);
    this.empresas.set([]);
    this.seleccionada.set(null);
    this.error.set(null);

    try {
      const empresas = await firstValueFrom(
        this.http.get<EmpresaDisponible[]>(`${this.apiUrl}/contexto/empresas`)
      );

      if (this.auth.user()?.id !== usuarioId) return;

      this.empresas.set(empresas);

      const key = `nextag.empresa.${usuarioId}`;
      const guardada = this.storage.getItem(key);
      const seleccionada = empresas.find(x => x.id === guardada) ?? empresas[0] ?? null;

      this.seleccionada.set(seleccionada);
      if (seleccionada) this.storage.setItem(key, seleccionada.id);
    } catch {
      if (this.auth.user()?.id === usuarioId)
        this.error.set('No fue posible cargar las empresas disponibles.');
    } finally {
      this.cargando.set(false);
    }
  }

  seleccionar(empresaId: string): boolean {
    const empresa = this.empresas().find(x => x.id === empresaId);
    if (!empresa || empresa.id === this.empresaId) return false;

    this.seleccionada.set(empresa);
    const usuarioId = this.auth.user()?.id;
    if (usuarioId) this.storage.setItem(`nextag.empresa.${usuarioId}`, empresa.id);
    return true;
  }

  limpiar(): void {
    this.empresas.set([]);
    this.seleccionada.set(null);
    this.error.set(null);
    this.cargando.set(false);
  }
}