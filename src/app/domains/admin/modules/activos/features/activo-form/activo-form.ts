import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { CategoriasActivoService } from '../../../categorias-activo/services/categorias-activo.service';
import { CategoriaActivoList } from '../../../categorias-activo/types/categoria-activo.types';
import { MarcasService } from '../../../marcas/services/marcas.service';
import { MarcaList } from '../../../marcas/types/marca.types';
import { ModelosActivoService } from '../../../modelos-activo/services/modelos-activo.service';
import { ModeloActivoList } from '../../../modelos-activo/types/modelo-activo.types';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { ProveedorList } from '../../../proveedores/types/proveedor.types';
import { SucursalesService } from '../../../sucursales/services/sucursales.service';
import { SucursalList } from '../../../sucursales/types/sucursal.types';
import { UbicacionesService } from '../../../ubicaciones/services/ubicaciones.service';
import { UbicacionList } from '../../../ubicaciones/types/ubicacion.types';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoEtiquetas } from '../activo-etiquetas/activo-etiquetas';
import { ActivosService } from '../../services/activos.service';
import { ActivoDetalle, ActivoGuardar } from '../../types/activo.types';

@Component({
  selector: 'app-activo-form',
  templateUrl: './activo-form.html',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, ActivoEtiquetas],
})
export default class ActivoForm {
  protected readonly empresa = inject(EmpresaContextoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ActivosService);
  private readonly categoriasService = inject(CategoriasActivoService);
  private readonly marcasService = inject(MarcasService);
  private readonly modelosService = inject(ModelosActivoService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly ubicacionesService = inject(UbicacionesService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly auth = inject(AuthService);
  private anteriorEmpresa: string | null = null;

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly esEdicion = !!this.id;
  protected readonly detalle = signal<ActivoDetalle | null>(null);
  protected readonly categorias = signal<CategoriaActivoList[]>([]);
  protected readonly marcas = signal<MarcaList[]>([]);
  protected readonly modelos = signal<ModeloActivoList[]>([]);
  protected readonly sucursales = signal<SucursalList[]>([]);
  protected readonly ubicaciones = signal<UbicacionList[]>([]);
  protected readonly proveedores = signal<ProveedorList[]>([]);
  protected readonly categoriaElegida = signal('');
  protected readonly marcaElegida = signal('');
  protected readonly sucursalElegida = signal('');
  protected readonly loading = signal(false);
  protected readonly cargado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly puedeGestionar = computed(() => this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA]));
  protected readonly soloConsulta = computed(() => !this.puedeGestionar() || this.detalle()?.estadoActivoId === 7);
  protected readonly modelosFiltrados = computed(() => this.modelos().filter(x =>
    x.categoriaActivoId === this.categoriaElegida() && x.marcaId === this.marcaElegida()));
  protected readonly ubicacionesFiltradas = computed(() => this.ubicaciones().filter(x => x.sucursalId === this.sucursalElegida()));

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    numeroInventario: ['', Validators.maxLength(100)],
    numeroSerie: ['', Validators.maxLength(150)],
    descripcion: ['', Validators.maxLength(500)],
    categoriaActivoId: ['', Validators.required],
    marcaId: [''],
    modeloActivoId: [''],
    sucursalId: ['', Validators.required],
    ubicacionId: [''],
    proveedorId: [''],
    tipoPropiedad: this.fb.nonNullable.control<'PROPIO' | 'ARRENDADO' | 'COMODATO' | 'TERCERO'>('PROPIO'),
    propietarioProveedorId: [''],
    propietarioNombre: ['', Validators.maxLength(200)],
    fechaAdquisicion: [''],
    costoAdquisicion: ['', Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    moneda: ['MXN', [Validators.required, Validators.pattern(/^[a-zA-Z]{3}$/)]],
    observaciones: ['', Validators.maxLength(1000)],
  });

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresa.seleccionada()?.id ?? null;
      // No conservar en pantalla un activo de otra empresa al cambiar el contexto.
      if (empresaId && this.anteriorEmpresa && empresaId !== this.anteriorEmpresa && this.esEdicion) {
        void this.router.navigate(['/admin/activos']);
        return;
      }
      this.anteriorEmpresa = empresaId;
      this.detalle.set(null); this.cargado.set(false);
      this.loading.set(!!empresaId); this.error.set(null); this.exito.set(null);
      this.form.reset(); this.form.enable({ emitEvent: false });
      this.categoriaElegida.set(''); this.marcaElegida.set(''); this.sucursalElegida.set('');
      if (!empresaId) return;
      const sub = forkJoin({
        categorias: this.categoriasService.getAll(),
        marcas: this.marcasService.getAll(),
        modelos: this.modelosService.getAll(),
        sucursales: this.sucursalesService.getAll(),
        ubicaciones: this.ubicacionesService.getAll(),
        proveedores: this.proveedoresService.getAll(),
        detalle: this.id ? this.service.getById(this.id) : of(null),
      }).subscribe({
        next: datos => {
          if (this.empresa.empresaId !== empresaId) return;
          this.categorias.set(datos.categorias); this.marcas.set(datos.marcas);
          this.modelos.set(datos.modelos); this.sucursales.set(datos.sucursales);
          this.ubicaciones.set(datos.ubicaciones); this.proveedores.set(datos.proveedores);
          if (datos.detalle) {
            const d = datos.detalle;
            this.detalle.set(d);
            this.categoriaElegida.set(d.categoriaActivoId);
            this.marcaElegida.set(d.marcaId ?? '');
            this.sucursalElegida.set(d.sucursalId);
            this.form.patchValue({
              codigo: d.codigo, nombre: d.nombre,
              numeroInventario: d.numeroInventario ?? '', numeroSerie: d.numeroSerie ?? '',
              descripcion: d.descripcion ?? '', categoriaActivoId: d.categoriaActivoId,
              marcaId: d.marcaId ?? '', modeloActivoId: d.modeloActivoId ?? '',
              sucursalId: d.sucursalId, ubicacionId: d.ubicacionId ?? '',
              proveedorId: d.proveedorId ?? '', tipoPropiedad: d.tipoPropiedad as ActivoGuardar['tipoPropiedad'],
              propietarioProveedorId: d.propietarioProveedorId ?? '',
              propietarioNombre: d.propietarioNombre ?? '',
              fechaAdquisicion: d.fechaAdquisicion?.slice(0, 10) ?? '',
              costoAdquisicion: d.costoAdquisicion === null ? '' : String(d.costoAdquisicion),
              moneda: d.moneda, observaciones: d.observaciones ?? '',
            });
          }
          if (!this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA]) || datos.detalle?.estadoActivoId === 7) this.form.disable({ emitEvent: false });
          this.cargado.set(true); this.loading.set(false);
        },
        error: err => {
          if (this.empresa.empresaId !== empresaId) return;
          this.error.set(mensajeApi(err, 'No fue posible cargar los datos del activo.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected seleccionarCategoria(id: string): void {
    this.categoriaElegida.set(id); this.form.controls.modeloActivoId.setValue('');
  }
  protected seleccionarMarca(id: string): void {
    this.marcaElegida.set(id); this.form.controls.modeloActivoId.setValue('');
  }
  protected seleccionarSucursal(id: string): void {
    this.sucursalElegida.set(id); this.form.controls.ubicacionId.setValue('');
  }
  protected volver(): void { void this.router.navigate(['/admin/activos']); }

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.cargado() || this.soloConsulta()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const empresaId = this.empresa.empresaId;
    if (!empresaId) { this.error.set('Selecciona una empresa.'); return; }
    const v = this.form.getRawValue();
    if (!v.codigo.trim() || !v.nombre.trim()) { this.error.set('El código y el nombre son obligatorios.'); return; }
    if (v.propietarioProveedorId && v.propietarioNombre.trim()) {
      this.error.set('Indica un proveedor propietario o un nombre de propietario externo, no ambos.'); return;
    }
    if (v.modeloActivoId && (!v.marcaId || !this.modelosFiltrados().some(x => x.id === v.modeloActivoId))) {
      this.error.set('El modelo debe corresponder a la marca y categoría seleccionadas.'); return;
    }
    if (v.ubicacionId && !this.ubicacionesFiltradas().some(x => x.id === v.ubicacionId)) {
      this.error.set('Selecciona una ubicación de la sucursal elegida.'); return;
    }
    const costo = v.costoAdquisicion.trim() ? Number(v.costoAdquisicion) : null;
    if (costo !== null && (!Number.isFinite(costo) || costo < 0 || costo >= 10000000000000000)) {
      this.error.set('El costo de adquisición está fuera del rango permitido.'); return;
    }
    const nil = (texto: string): string | null => texto.trim() || null;
    const dto: ActivoGuardar = {
      codigo: v.codigo.trim().toUpperCase(), nombre: v.nombre.trim(),
      numeroInventario: nil(v.numeroInventario), numeroSerie: nil(v.numeroSerie), descripcion: nil(v.descripcion),
      categoriaActivoId: v.categoriaActivoId, marcaId: nil(v.marcaId), modeloActivoId: nil(v.modeloActivoId),
      sucursalId: v.sucursalId, ubicacionId: nil(v.ubicacionId), proveedorId: nil(v.proveedorId),
      tipoPropiedad: v.tipoPropiedad, propietarioProveedorId: nil(v.propietarioProveedorId),
      propietarioNombre: nil(v.propietarioNombre), fechaAdquisicion: v.fechaAdquisicion ? `${v.fechaAdquisicion}T00:00:00` : null,
      costoAdquisicion: costo, moneda: v.moneda.trim().toUpperCase(), observaciones: nil(v.observaciones),
    };
    this.guardando.set(true); this.error.set(null); this.exito.set(null);
    try {
      if (this.id) {
        const actualizado = await firstValueFrom(this.service.update(this.id, dto));
        if (this.empresa.empresaId === empresaId) {
          this.detalle.set(actualizado); this.form.markAsPristine();
          this.exito.set('Activo actualizado correctamente.');
        }
      } else {
        const creado = await firstValueFrom(this.service.create(dto));
        if (this.empresa.empresaId === empresaId) {
          await this.router.navigate(['/admin/activos', creado.id]);
        }
      }
    } catch (err) {
      if (this.empresa.empresaId === empresaId)
        this.error.set(mensajeApi(err, 'No fue posible guardar el activo.'));
    } finally { this.guardando.set(false); }
  }
}
