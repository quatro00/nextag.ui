import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-usuario-roles',
  imports: [
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './usuario-roles.html',
})
export class UsuarioRoles {
  @Input() rolesDisponibles: string[] = [];
  @Input() seleccionados: string[] = [];
  @Output() seleccionadosChange = new EventEmitter<string[]>();

  estaSeleccionado(rol: string): boolean {
    return this.seleccionados.some(x => x.toUpperCase() === rol.toUpperCase());
  }

  cambiarRol(rol: string, checked: boolean): void {
    const roles = checked
      ? [...this.seleccionados, rol]
      : this.seleccionados.filter(x => x.toUpperCase() !== rol.toUpperCase());

    this.seleccionadosChange.emit([...new Set(roles)]);
  }
}