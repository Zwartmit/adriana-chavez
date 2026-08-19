// Tipos del schema de Supabase para el proyecto Adriana Chávez
// Actualizar cuando se añadan nuevas tablas o columnas

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Rol = "admin" | "estilista" | "cliente";
export type EstadoCita = "pendiente" | "confirmada" | "en_proceso" | "completada" | "cancelada" | "no_asistio";
export type EstadoOrden = "pendiente" | "pagada" | "en_preparacion" | "enviada" | "entregada" | "cancelada" | "reembolsada";
export type CanalOrigen = "web" | "whatsapp" | "telefono" | "presencial";
export type TipoMovimiento = "entrada" | "salida" | "ajuste";
export type CategoriaGaleria = "antes-despues" | "coloracion" | "corte" | "tratamiento" | "unas" | "peinado";

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          rol: Rol;
          nombre: string | null;
          telefono: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["perfiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Insert"]>;
      };
      estilistas: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["estilistas"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["estilistas"]["Insert"]>;
      };
      categorias_servicios: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          orden: number;
        };
        Insert: Omit<Database["public"]["Tables"]["categorias_servicios"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["categorias_servicios"]["Insert"]>;
      };
      servicios: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["servicios"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["servicios"]["Insert"]>;
      };
      clientes: {
        Row: {
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
          estilista_preferido_id: string | null;
          acepta_datos: boolean;
          fecha_acepta: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clientes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
      };
      citas: {
        Row: {
          id: string;
          cliente_id: string;
          estilista_id: string | null;
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
        };
        Insert: Omit<Database["public"]["Tables"]["citas"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["citas"]["Insert"]>;
      };
      bloqueos_horario: {
        Row: {
          id: string;
          estilista_id: string | null;
          fecha_inicio: string;
          fecha_fin: string;
          motivo: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bloqueos_horario"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["bloqueos_horario"]["Insert"]>;
      };
      categorias_productos: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          orden: number;
        };
        Insert: Omit<Database["public"]["Tables"]["categorias_productos"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["categorias_productos"]["Insert"]>;
      };
      productos: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["productos"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["productos"]["Insert"]>;
      };
      inventario: {
        Row: {
          id: string;
          producto_id: string;
          stock_virtual: number;
          stock_fisico: number;
          umbral_alerta: number;
          unidad: string;
          ultima_entrada: string | null;
          ultima_salida: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["inventario"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["inventario"]["Insert"]>;
      };
      movimientos_inventario: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["movimientos_inventario"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["movimientos_inventario"]["Insert"]>;
      };
      ordenes: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["ordenes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["ordenes"]["Insert"]>;
      };
      items_orden: {
        Row: {
          id: string;
          orden_id: string;
          producto_id: string | null;
          nombre: string;
          precio: number;
          cantidad: number;
          subtotal: number;
        };
        Insert: Omit<Database["public"]["Tables"]["items_orden"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["items_orden"]["Insert"]>;
      };
      testimonios: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["testimonios"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["testimonios"]["Insert"]>;
      };
      galeria: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["galeria"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["galeria"]["Insert"]>;
      };
      reportes_caja: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["reportes_caja"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reportes_caja"]["Insert"]>;
      };
    };
    Views: {
      inventario_completo: {
        Row: {
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
        };
      };
    };
    Functions: {
      es_admin: { Args: Record<never, never>; Returns: boolean };
      es_staff: { Args: Record<never, never>; Returns: boolean };
    };
  };
}
