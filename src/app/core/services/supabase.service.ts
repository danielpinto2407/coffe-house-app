import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly bucketName = 'menu';

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sb-zeauqjdwayafrjsqcbrm-auth-token',
          // ✅ Desactivar locks que causan NavigatorLockAcquireTimeoutError en móvil
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  }

  /**
   * Acceso público al cliente de Supabase
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Sube un PDF a Supabase Storage en el bucket 'menu'
   * ✅ Si es 'menu.pdf', sobrescribe el anterior (upsert)
   * @param fileName - Nombre base del archivo
   * @param pdfBlob - Contenido del PDF como Blob
   * @returns URL pública del archivo subido
   * @throws Error si falla la subida
   */
  async uploadPdf(fileName: string, pdfBlob: Blob): Promise<string> {
    if (!fileName?.trim() || !pdfBlob) {
      throw new Error('Nombre de archivo o PDF inválido');
    }

    try {
      // ✅ Si es 'menu.pdf', sobrescribir; si no, adicionar timestamp
      let finalFileName = fileName;
      if (fileName !== 'menu.pdf') {
        const timestamp = Date.now();
        finalFileName = `${timestamp}-${fileName}`;
      }

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(finalFileName, pdfBlob, {
          cacheControl: '0',  // ✅ SIN CACHÉ para ver cambios inmediatos
          upsert: true  // ✅ Sobrescribir si existe
        });

      if (error) {
        // RLS policy error
        if (error.message?.includes('row-level security')) {
          throw new Error('Permiso denegado: Revisa las políticas RLS del bucket "menu" en Supabase. El usuario debe tener permisos para subir archivos.');
        }
        throw new Error(`Error Supabase: ${error.message}`);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`No se pudo subir el PDF: ${errorMsg}`);
    }
  }

  /**
   * Obtiene la URL del PDF 'menu.pdf' si existe en Supabase
   * ✅ Verifica que el archivo exista antes de retornar
   * @throws Error si el archivo no existe
   */
  async getPdfUrl(fileName: string = 'menu.pdf'): Promise<string> {
    if (!fileName?.trim()) {
      throw new Error('Nombre de archivo inválido');
    }

    try {
      // ✅ Verificar que el archivo existe listando el bucket
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list();

      if (listError) {
        throw new Error(`Error al verificar archivos: ${listError.message}`);
      }

      const fileExists = (files || []).some(f => f.name === fileName);
      if (!fileExists) {
        throw new Error(`Archivo '${fileName}' no existe en Supabase`);
      }

      // ✅ Retornar URL pública
      return this.getPublicUrl(fileName);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMsg);
    }
  }

  /**
   * Obtiene la lista de archivos en el bucket 'menu'
   * @returns Array de metadatos de archivos en el bucket
   * @throws Error si falla la operación
   */
  async listFiles(): Promise<Array<{ name: string; id: string; updated_at: string }>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(undefined, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }

      // Filtrar y mapear archivos con id y updated_at válidos
      return (data || [])
        .filter((file) => file.id !== null && file.updated_at !== null)
        .map((file) => ({
          name: file.name,
          id: file.id as string,
          updated_at: file.updated_at as string,
        }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`No se pudo listar archivos: ${errorMsg}`);
    }
  }

  /**
   * Obtiene la URL pública de un archivo en el bucket
   * @param fileName - Nombre del archivo
   * @returns URL pública del archivo
   * @throws Error si el nombre es inválido
   */
  getPublicUrl(fileName: string): string {
    if (!fileName?.trim()) {
      throw new Error('Nombre de archivo inválido');
    }

    try {
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener URL pública');
      }

      return data.publicUrl;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`No se pudo obtener URL: ${errorMsg}`);
    }
  }

  /**
   * Realiza una consulta genérica a una tabla
   * @param tableName - Nombre de la tabla
   * @param options - Opciones de filtrado, ordenamiento, etc.
   * @returns Array de registros o null si hay error
   */
  async query<T>(tableName: string, options?: {
    order?: Array<{ column: string; ascending: boolean }>;
    filters?: Array<{ column: string; operator: string; value: any }>;
    limit?: number;
  }): Promise<T[] | null> {
    try {
      let query = this.supabase.from(tableName).select('*');

      // Aplicar filtros si existen
      if (options?.filters) {
        for (const filter of options.filters) {
          if (filter.operator === 'eq') {
            query = query.eq(filter.column, filter.value);
          } else if (filter.operator === 'gte') {
            query = query.gte(filter.column, filter.value);
          } else if (filter.operator === 'lte') {
            query = query.lte(filter.column, filter.value);
          }
        }
      }

      // Aplicar ordenamiento
      if (options?.order) {
        for (const orderBy of options.order) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }
      }

      // Aplicar limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }

      // Convertir snake_case a camelCase para los objetos retornados
      if (Array.isArray(data)) {
        return data.map(item => this.snakeToCamelCase(item)) as T[] | null;
      }

      return data as T[] | null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMsg);
    }
  }

  /**
   * Convierte keys de camelCase a snake_case para compatibilidad con Supabase
   */
  private camelToSnakeCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const newObj: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = obj[key];
      }
    }
    
    return newObj;
  }

  /**
   * Convierte keys de snake_case a camelCase cuando recibimos datos de Supabase
   */
  private snakeToCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const newObj: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[camelKey] = obj[key];
      }
    }
    
    return newObj;
  }

  /**
   * Inserta un nuevo registro en una tabla
   * @param tableName - Nombre de la tabla
   * @param data - Datos a insertar
   * @returns Registro insertado
   */
  async insert<T>(tableName: string, data: any): Promise<T> {
    try {
      const convertedData = this.camelToSnakeCase(data);
      const { data: inserted, error } = await this.supabase
        .from(tableName)
        .insert([convertedData])
        .select()
        .single();

      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }

      if (!inserted) {
        throw new Error('No se retornó el registro insertado');
      }

      // Convertir snake_case a camelCase
      return this.snakeToCamelCase(inserted) as T;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMsg);
    }
  }

  /**
   * Actualiza un registro en una tabla
   * @param tableName - Nombre de la tabla
   * @param id - ID del registro
   * @param updates - Campos a actualizar
   * @returns Registro actualizado
   */
  async update<T>(tableName: string, id: number, updates: any): Promise<T> {
    try {
      const convertedUpdates = this.camelToSnakeCase(updates);
      const { data: updated, error } = await this.supabase
        .from(tableName)
        .update(convertedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Update error: ${error.message}`);
      }

      if (!updated) {
        throw new Error('No se retornó el registro actualizado');
      }

      // Convertir snake_case a camelCase
      return this.snakeToCamelCase(updated) as T;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMsg);
    }
  }

  /**
   * Elimina un registro de una tabla
   * @param tableName - Nombre de la tabla
   * @param id - ID del registro
   */
  async delete(tableName: string, id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Delete error: ${error.message}`);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMsg);
    }
  }

  /**
   * ✅ Obtiene el cliente de Supabase (para usar en otros servicios)
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * ✅ Elimina un archivo del bucket de storage
   * @param bucket - Nombre del bucket
   * @param path - Ruta del archivo en el bucket
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      if (!path?.trim()) {
        throw new Error('Ruta de archivo inválida');
      }

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Error al eliminar archivo: ${error.message}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMsg);
    }
  }
}
