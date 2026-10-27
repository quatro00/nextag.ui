import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-usuario-estatus',
  imports: [MatIconModule],
  templateUrl: './usuario-estatus.html',
})
export class UsuarioEstatus {
  @Input() activo = false;
}