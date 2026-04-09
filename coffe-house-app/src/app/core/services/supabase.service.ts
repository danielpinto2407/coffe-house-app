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
      environment.supabase.anonKey
    );
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
          cacheControl: '3600',
          upsert: true  // ✅ Sobrescribir si existe
        });

      if (error) {
        console.error('🔴 Supabase Storage Error:', error);
        // RLS policy error
        if (error.message?.includes('row-level security')) {
          throw new Error('Permiso denegado: Revisa las políticas RLS del bucket "menu" en Supabase. El usuario debe tener permisos para subir archivos.');
        }
        throw new Error(`Error Supabase: ${error.message}`);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log(`✅ PDF subido exitosamente: ${finalFileName}`);
      return publicUrlData.publicUrl;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ Error subiendo PDF: ${errorMsg}`);
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
      console.error(`❌ Error getPdfUrl: ${errorMsg}`);
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

      console.log(`✅ Se encontraron ${data?.length || 0} archivos en bucket`);
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
      console.error(`❌ Error listando archivos: ${errorMsg}`);
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

      console.log(`✅ URL pública generada para: ${fileName}`);
      return data.publicUrl;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ Error obteniendo URL pública: ${errorMsg}`);
      throw new Error(`No se pudo obtener URL: ${errorMsg}`);
    }
  }
}
