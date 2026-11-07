export type EstatusEtiquetaPublica =
  | 'ACTIVO'
  | 'SIN_ASIGNAR';

export interface EmpresaPublica {
  nombre: string;
  logoUrl: string | null;
}

export interface ActivoPublico {
  nombre: string | null;
  codigo: string | null;
  numeroInventario: string | null;
  numeroSerie: string | null;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  sucursal: string | null;
  ubicacion: string | null;
  estado: string | null;
}

export interface EtiquetaPublica {
  codigoEtiqueta: string;
  estatus: EstatusEtiquetaPublica;
  mensaje: string;
  empresa: EmpresaPublica | null;
  activo: ActivoPublico | null;
  permitirTicketPublico: boolean;
}