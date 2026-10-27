import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsuarioEstatus } from '../../components/usuario-estatus/usuario-estatus';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioList } from '../../types/usuario.types';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    UsuarioEstatus,
  ],
})
export default class UsuariosList implements OnInit {
  private service = inject(UsuariosService);
  private router = inject(Router);

  protected usuarios = signal<UsuarioList[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected busqueda = signal('');

  protected total = computed(() => this.usuarios().length);
  protected activos = computed(() => this.usuarios().filter(x => x.activo).length);
  protected inactivos = computed(() => this.usuarios().filter(x => !x.activo).length);

  protected usuariosFiltrados = computed(() => {
    const value = this.busqueda().trim().toLowerCase();
    if (!value) return this.usuarios();

    return this.usuarios().filter(x =>
      `${x.nombre} ${x.apellidos} ${x.email} ${x.roles.join(' ')}`
        .toLowerCase()
        .includes(value)
    );
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.usuarios.set(await firstValueFrom(this.service.getAll()));
    } catch {
      this.errorMessage.set('No fue posible cargar los usuarios.');
    } finally {
      this.loading.set(false);
    }
  }

  nuevo(): void {
    void this.router.navigate(['/admin/usuarios/nuevo']);
  }

  editar(id: string): void {
    void this.router.navigate(['/admin/usuarios', id]);
  }

  async cambiarEstatus(usuario: UsuarioList): Promise<void> {
    try {
      await firstValueFrom(this.service.updateStatus(usuario.id, !usuario.activo));

      this.usuarios.update(items =>
        items.map(x => x.id === usuario.id ? { ...x, activo: !x.activo } : x)
      );
    } catch {
      this.errorMessage.set('No fue posible actualizar el estatus del usuario.');
    }
  }

  cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
}