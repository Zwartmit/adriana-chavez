// Tipos del schema de Supabase para el proyecto Adriana Chávez
// Actualizar cuando se añadan nuevas tablas o columnas

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Rol = "admin" | "profesional" | "cliente";
export type EstadoCita = "pendiente" | "confirmada" | "en_proceso" | "completada" | "cancelada" | "no_asistio";
export type EstadoOrden = "pendiente" | "pagada" | "en_preparacion" | "enviada" | "entregada" | "cancelada" | "reembolsada";
export type CanalOrigen = "web" | "whatsapp" | "telefono" | "presencial";
export type TipoMovimiento = "entrada" | "salida" | "ajuste";
export type CategoriaGaleria = "antes-despues" | "coloracion" | "corte" | "tratamiento" | "unas" | "peinado";

export interface PerfilesRow {
          id: string;
          rol: Rol;
          nombre: string | null;
          telefono: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        }
export interface ProfesionalsRow {
          id: string;
          perfil_id: string | null;
          nombre: string;
          cargo: string;
          especialidades: string[];
          bio: string | null;
          foto_url: string | null;
          anos_experiencia: number;
          color_calendario: string;
          activo: boolean;
          orden: number;
          created_at: string;
          updated_at: string;
        }
export interface Categorias_serviciosRow {
          id: string;
          nombre: string;
          slug: string;
          orden: number;
        }
export interface ServiciosRow {
          id: string;
          categoria_id: string | null;
          nombre: string;
          slug: string;
          descripcion: string | null;
          duracion_min: number;
          precio: number;
          precio_desde: boolean;
          imagen_url: string | null;
          requiere_cita: boolean;
          activo: boolean;
          destacado: boolean;
          orden: number;
          created_at: string;
          updated_at: string;
        }
export interface ClientesRow {
          id: string;
          perfil_id: string | null;
          nombre: string;
          apellido: string | null;
          email: string | null;
          telefono: string | null;
          fecha_nacimiento: string | null;
          notas: string | null;
          alergias: string | null;
          preferencias: string | null;
          profesional_preferido_id: string | null;
          acepta_datos: boolean;
          fecha_acepta: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        }
export interface CitasRow {
          id: string;
          cliente_id: string;
          profesional_id: string | null;
          servicio_id: string | null;
          fecha_hora: string;
          duracion_min: number;
          estado: EstadoCita;
          precio_cobrado: number | null;
          notas_cliente: string | null;
          notas_internas: string | null;
          canal_origen: CanalOrigen;
          recordatorio_24h_enviado: boolean;
          recordatorio_2h_enviado: boolean;
          seguimiento_enviado: boolean;
          created_at: string;
          updated_at: string;
        }
export interface Bloqueos_horarioRow {
          id: string;
          profesional_id: string | null;
          fecha_inicio: string;
          fecha_fin: string;
          motivo: string | null;
          created_by: string | null;
          created_at: string;
        }
export interface Categorias_productosRow {
          id: string;
          nombre: string;
          slug: string;
          orden: number;
        }
export interface ProductosRow {
          id: string;
          categoria_id: string | null;
          nombre: string;
          slug: string;
          marca: string;
          descripcion: string | null;
          descripcion_larga: string | null;
          caracteristicas: Json;
          precio: number;
          precio_original: number | null;
          imagenes: string[];
          rating: number;
          total_resenas: number;
          es_nuevo: boolean;
          destacado: boolean;
          activo: boolean;
          orden: number;
          created_at: string;
          updated_at: string;
        }
export interface InventarioRow {
          id: string;
          producto_id: string;
          stock_virtual: number;
          stock_fisico: number;
          umbral_alerta: number;
          unidad: string;
          ultima_entrada: string | null;
          ultima_salida: string | null;
          updated_at: string;
        }
export interface Movimientos_inventarioRow {
          id: string;
          producto_id: string;
          tipo: TipoMovimiento;
          origen: string | null;
          cantidad: number;
          stock_antes: number;
          stock_despues: number;
          notas: string | null;
          referencia_id: string | null;
          created_by: string | null;
          created_at: string;
        }
export interface OrdenesRow {
          id: string;
          cliente_id: string | null;
          estado: EstadoOrden;
          subtotal: number;
          costo_envio: number;
          total: number;
          nombre_envio: string | null;
          telefono_envio: string | null;
          direccion_envio: string | null;
          ciudad_envio: string | null;
          wompi_referencia: string | null;
          wompi_estado: string | null;
          wompi_metodo: string | null;
          fecha_pago: string | null;
          notas_cliente: string | null;
          notas_internas: string | null;
          created_at: string;
          updated_at: string;
        }
export interface Items_ordenRow {
          id: string;
          orden_id: string;
          producto_id: string | null;
          nombre: string;
          precio: number;
          cantidad: number;
          subtotal: number;
        }
export interface TestimoniosRow {
          id: string;
          cliente_id: string | null;
          nombre: string;
          servicio: string | null;
          texto: string;
          rating: number;
          desde_anio: number | null;
          aprobado: boolean;
          orden: number;
          created_at: string;
        }
export interface GaleriaRow {
          id: string;
          titulo: string | null;
          categoria: CategoriaGaleria;
          tag: string | null;
          imagen_url: string;
          imagen_antes_url: string | null;
          destacado: boolean;
          activo: boolean;
          orden: number;
          created_at: string;
        }
export interface Reportes_cajaRow {
          id: string;
          fecha: string;
          ingresos_servicios: number;
          ingresos_productos: number;
          total_ingresos: number;
          total_citas: number;
          citas_completadas: number;
          citas_canceladas: number;
          generado_por: string;
          notas: string | null;
          created_at: string;
        }
export interface Mensajes_contactoRow {
          id: string;
          nombre: string;
          telefono: string;
          email: string | null;
          servicio: string | null;
          mensaje: string;
          leido: boolean;
          created_at: string;
        }
export interface Inventario_completoViewRow {
          id: string;
          producto_id: string;
          stock_virtual: number;
          stock_fisico: number;
          stock_total: number;
          umbral_alerta: number;
          estado_stock: "disponible" | "critico" | "agotado";
          producto_nombre: string;
          producto_marca: string;
          categoria_id: string;
          categoria_nombre: string;
          updated_at: string;
        }

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: PerfilesRow;
        Insert: Omit<PerfilesRow, "created_at" | "updated_at">;
        Update: Partial<Omit<PerfilesRow, "created_at" | "updated_at">>;
      };
      profesionales: {
        Row: ProfesionalsRow;
        Insert: Omit<ProfesionalsRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProfesionalsRow, "id" | "created_at" | "updated_at">>;
      };
      categorias_servicios: {
        Row: Categorias_serviciosRow;
        Insert: Omit<Categorias_serviciosRow, "id">;
        Update: Partial<Omit<Categorias_serviciosRow, "id">>;
      };
      servicios: {
        Row: ServiciosRow;
        Insert: Omit<ServiciosRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ServiciosRow, "id" | "created_at" | "updated_at">>;
      };
      clientes: {
        Row: ClientesRow;
        Insert: Omit<ClientesRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ClientesRow, "id" | "created_at" | "updated_at">>;
      };
      citas: {
        Row: CitasRow;
        Insert: Omit<CitasRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CitasRow, "id" | "created_at" | "updated_at">>;
      };
      bloqueos_horario: {
        Row: Bloqueos_horarioRow;
        Insert: Omit<Bloqueos_horarioRow, "id" | "created_at">;
        Update: Partial<Omit<Bloqueos_horarioRow, "id" | "created_at">>;
      };
      categorias_productos: {
        Row: Categorias_productosRow;
        Insert: Omit<Categorias_productosRow, "id">;
        Update: Partial<Omit<Categorias_productosRow, "id">>;
      };
      productos: {
        Row: ProductosRow;
        Insert: Omit<ProductosRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProductosRow, "id" | "created_at" | "updated_at">>;
      };
      inventario: {
        Row: InventarioRow;
        Insert: Omit<InventarioRow, "id" | "updated_at">;
        Update: Partial<Omit<InventarioRow, "id" | "updated_at">>;
      };
      movimientos_inventario: {
        Row: Movimientos_inventarioRow;
        Insert: Omit<Movimientos_inventarioRow, "id" | "created_at">;
        Update: Partial<Omit<Movimientos_inventarioRow, "id" | "created_at">>;
      };
      ordenes: {
        Row: OrdenesRow;
        Insert: Omit<OrdenesRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<OrdenesRow, "id" | "created_at" | "updated_at">>;
      };
      items_orden: {
        Row: Items_ordenRow;
        Insert: Omit<Items_ordenRow, "id">;
        Update: Partial<Omit<Items_ordenRow, "id">>;
      };
      testimonios: {
        Row: TestimoniosRow;
        Insert: Omit<TestimoniosRow, "id" | "created_at">;
        Update: Partial<Omit<TestimoniosRow, "id" | "created_at">>;
      };
      galeria: {
        Row: GaleriaRow;
        Insert: Omit<GaleriaRow, "id" | "created_at">;
        Update: Partial<Omit<GaleriaRow, "id" | "created_at">>;
      };
      reportes_caja: {
        Row: Reportes_cajaRow;
        Insert: Omit<Reportes_cajaRow, "id" | "created_at">;
        Update: Partial<Omit<Reportes_cajaRow, "id" | "created_at">>;
      };
      mensajes_contacto: {
        Row: Mensajes_contactoRow;
        Insert: Omit<Mensajes_contactoRow, "id" | "created_at">;
        Update: Partial<Omit<Mensajes_contactoRow, "id" | "created_at">>;
      };
    };
    Views: {
      inventario_completo: {
        Row: Inventario_completoViewRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
      };
    };
    Functions: {
      es_admin: { Args: Record<never, never>; Returns: boolean };
      es_staff: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}


