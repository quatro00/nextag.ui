import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-departamento-estatus',
  imports: [MatIconModule],
  templateUrl: './departamento-estatus.html',
})
export class DepartamentoEstatusComponent {
  @Input() activo = false;
}