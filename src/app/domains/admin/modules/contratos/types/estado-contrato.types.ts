export interface EstadoContrato {

    id: number;

    clave: string;

    nombre: string;

    descripcion: string | null;

    activo: boolean;

    orden: number;
}

export interface EstadoContratoFiltros {

    activo?: boolean;
}