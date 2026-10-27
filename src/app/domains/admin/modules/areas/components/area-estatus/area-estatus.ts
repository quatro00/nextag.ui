import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-area-estatus',
  imports: [MatIconModule],
  templateUrl: './area-estatus.html',
})
export class AreaEstatusComponent {
  @Input() activo = false;
}