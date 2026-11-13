export interface EtiquetaConfiguracionGuardar {
  activo: boolean;
  permitirTicketPublico: boolean;

  mostrarNombreActivo: boolean;
  mostrarCodigoActivo: boolean;
  mostrarNumeroInventario: boolean;
  mostrarNumeroSerie: boolean;

  mostrarCategoria: boolean;
  mostrarMarcaModelo: boolean;

  mostrarSucursal: boolean;
  mostrarUbicacion: boolean;
  mostrarResponsable: boolean;
  mostrarEstadoActivo: boolean;

  mostrarDatosEmpresa: boolean;
}

export interface EtiquetaConfiguracion
  extends EtiquetaConfiguracionGuardar {

  id: string | null;
  empresaId: string;
}