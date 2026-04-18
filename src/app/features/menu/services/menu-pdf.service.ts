import { Injectable, signal, inject } from '@angular/core';
import type { Content } from 'pdfmake/interfaces';
import { MenuStructure } from '../models/menu-structure.model';
import { Product } from '../models/product.model';
import { ThemeService } from '../../../core/services/theme.service';

// Lazy load pdfMake only when needed
let pdfMakeInstance: any = null;
let isPdfMakeInitialized = false;

async function getPdfMake(): Promise<any> {
  if (!isPdfMakeInitialized && !pdfMakeInstance) {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
    pdfMake.addVirtualFileSystem(pdfFonts);
    pdfMakeInstance = pdfMake;
    isPdfMakeInitialized = true;
  }
  return pdfMakeInstance;
}

interface PdfColors extends Record<string, string> {
  bgDark: string;
  bgGray: string;
  primary: string;
  secondary: string;
  text: string;
  textMuted: string;
}

type PdfExportFormat = 'download' | 'blob' | 'base64' | 'dataUrl' | 'print';

interface PdfConfig {
  pageSize: 'A4' | 'LETTER';
  pageMargins: [number, number, number, number];
  logo: { width: number; height: number; maxSize: number };
  portada: {
    emojiSize: number;
    titleSize: number;
    subtitleSize: number;
    subtitleMargin: number;
  };
  decorativeLine: {
    x1: number;
    x2: number;
    lineWidth: number;
    secondLineWidth: number;
    lineSpacing: number;
  };
  content: {
    dottedLineWidth: number;
    categoryTitleSize: number;
    descriptionSize: number;
    productLineWidth: number;
  };
  footer: {
    fontSize: number;
    borderWidth: number;
  };
  default: {
    fontSize: number;
    lineHeight: number;
  };
}

const PDF_CONFIG: PdfConfig = {
  pageSize: 'A4',
  pageMargins: [40, 40, 40, 40],
  logo: { width: 250, height: 250, maxSize: 500 },
  portada: {
    emojiSize: 72,
    titleSize: 32,
    subtitleSize: 12,
    subtitleMargin: 120,
  },
  decorativeLine: {
    x1: 80,
    x2: 420,
    lineWidth: 2,
    secondLineWidth: 0.5,
    lineSpacing: 8,
  },
  content: {
    dottedLineWidth: 0.5,
    categoryTitleSize: 18,
    descriptionSize: 9,
    productLineWidth: 0.3,
  },
  footer: {
    fontSize: 8,
    borderWidth: 0.5,
  },
  default: {
    fontSize: 10,
    lineHeight: 1.5,
  },
};

@Injectable({
  providedIn: 'root',
})
export class MenuPdfService {
  private readonly themeService = inject(ThemeService);

  isGenerating = signal(false);
  pdfError = signal<string | null>(null);
  private readonly cachedLogo = signal<string>('');
  private readonly cachedBgImage = signal<string>('');

  /** Ruta de la imagen de fondo del PDF. Asignar antes de generar. */
  bgImagePath = signal<string>('');

  async generateAndDownloadMenuPdf(
    menuData: MenuStructure[],
    fileName: string = 'Menu-CoffeeHouse.pdf',
    format: PdfExportFormat = 'download'
  ): Promise<Blob | string | void> {
    if (!menuData || menuData.length === 0) {
      this.pdfError.set('No menu data provided');
      return;
    }

    try {
      this.isGenerating.set(true);
      this.pdfError.set(null);

      const logoBase64 = await this.getLogoBase64();
      const bgImageBase64 = await this.getBgImageBase64();

      // Construir diccionario de imágenes para pdfmake — TODAS las imágenes van aquí
      const imagesDict = await this.convertMenuImagesToBase64(menuData);
      if (logoBase64) imagesDict['pdfLogo'] = logoBase64;
      if (bgImageBase64) imagesDict['pdfBg'] = bgImageBase64;

      const docDefinition = this.buildPdfDefinition(menuData, logoBase64, bgImageBase64, imagesDict);
      const pdfMake = await getPdfMake();
      const pdf = pdfMake.createPdf(docDefinition);

      return await this.exportPdf(pdf, fileName, format);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to generate menu PDF';
      this.pdfError.set(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.isGenerating.set(false);
    }
  }

  private async getLogoBase64(): Promise<string> {
    if (this.cachedLogo()) return this.cachedLogo();
    try {
      const logo = await this.loadAndValidateLogo('assets/img/logo.png');
      if (logo) this.cachedLogo.set(logo);
      return logo;
    } catch {
      return '';
    }
  }

  private async getBgImageBase64(): Promise<string> {
    if (this.cachedBgImage()) return this.cachedBgImage();
    const bgPath = this.bgImagePath();
    if (!bgPath) return '';
    try {
      const bg = await this.loadAndValidateLogo(bgPath);
      if (bg) this.cachedBgImage.set(bg);
      return bg;
    } catch {
      return '';
    }
  }

  /**
   * ✅ Genera el PDF del menú como un Blob (sin descargar)
   * @param menuData - Datos del menú
   * @returns Promise con el Blob del PDF
   */
  async generateMenuPdfBlob(menuData: MenuStructure[]): Promise<Blob> {
    const result = await this.generateAndDownloadMenuPdf(menuData, 'temp.pdf', 'blob');
    return result as Blob;
  }

  private async exportPdf(
    pdf: any,
    fileName: string,
    format: PdfExportFormat
  ): Promise<Blob | string | void> {
    switch (format) {
      case 'download':
        pdf.download(fileName);
        return;

      case 'blob':
        return await pdf.getBlob();

      case 'base64':
        return await pdf.getBase64();

      case 'dataUrl':
        return await pdf.getDataUrl();

      case 'print':
        await pdf.print();
        return;

      default:
        await pdf.download(fileName);
        return;
    }
  }

  /**
   * Convierte imágenes de todos los productos a base64 y retorna un diccionario
   * con clave 'product_<id>' → base64 dataURL para usarse en pdfmake `images`.
   */
  private async convertMenuImagesToBase64(menuData: MenuStructure[]): Promise<Record<string, string>> {
    const imagesDict: Record<string, string> = {};
    const allProducts: Product[] = [];

    for (const category of menuData) {
      if (category.products?.length) allProducts.push(...category.products);
      for (const sub of category.subcategories) {
        if (sub.products?.length) allProducts.push(...sub.products);
      }
    }

    await Promise.all(
      allProducts.map(async (product) => {
        if (!product.image) return;
        // Tamaño fijo 80x80 con cover crop para uniformidad en el PDF
        const base64 = await this.resolveImageToBase64(product.image, 80);
        if (base64) {
          imagesDict[`product_${product.id}`] = base64;
        }
      })
    );

    return imagesDict;
  }

  private async resolveImageToBase64(image: string, size?: number): Promise<string | null> {
    if (!image.startsWith('http') && !image.startsWith('assets/') &&
        !image.startsWith('data:image/jpeg') && !image.startsWith('data:image/png')) return null;
    try {
      let blob: Blob;
      if (image.startsWith('data:')) {
        const res = await fetch(image);
        blob = await res.blob();
      } else {
        const response = await fetch(image);
        if (!response.ok) return null;
        blob = await response.blob();
      }
      if (!blob.type.startsWith('image/')) return null;
      return await this.blobToJpegBase64(blob, size);
    } catch {
      return null;
    }
  }

  private blobToJpegBase64(blob: Blob, size?: number): Promise<string | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const srcW = img.naturalWidth || img.width;
          const srcH = img.naturalHeight || img.height;
          const canvas = document.createElement('canvas');

          if (size) {
            // Cover crop: escala y recorta al cuadrado fijo
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            // Fondo blanco para evitar negro en transparencias
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            const scale = Math.max(size / srcW, size / srcH);
            const drawW = srcW * scale;
            const drawH = srcH * scale;
            const offsetX = (size - drawW) / 2;
            const offsetY = (size - drawH) / 2;
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
          } else {
            canvas.width = srcW;
            canvas.height = srcH;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
          }

          // Productos: JPEG. Sin size = logo: PNG para preservar transparencia
          const dataUrl = size
            ? canvas.toDataURL('image/jpeg', 0.85)
            : canvas.toDataURL('image/png');
          resolve(dataUrl.startsWith('data:image/') ? dataUrl : null);
        } catch {
          resolve(null);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  private async loadAndValidateLogo(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load logo: ${response.status}`);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error(`Invalid logo MIME type: ${blob.type}`);
    // Sin size → PNG preserva transparencia del logo
    const png = await this.blobToJpegBase64(blob);
    return png ?? '';
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildPdfDefinition(
    menuData: MenuStructure[],
    logoBase64: string = '',
    bgImageBase64: string = '',
    imagesDict: Record<string, string> = {}
  ): any {
    const currentTheme = this.themeService.currentTheme();
    const colors = this.mapThemeColorsToPdf(currentTheme);
    const { pageSize, pageMargins } = PDF_CONFIG;

    const menuContent = this.buildMenuContentDark(menuData, colors, imagesDict);

    return {
      pageSize,
      pageMargins,
      footer: (currentPage: number, pageCount: number) =>
        this.buildFooterDark(currentPage, pageCount, colors) as Content,
      content: [
        // ── Marco decorativo superior ────────────────────────────────
        {
          canvas: [
            {
              type: 'line' as const,
              x1: 0, y1: 0, x2: 515, y2: 0,
              lineWidth: 3,
              lineColor: colors.primary,
            },
          ],
          margin: [0, 0, 0, 0],
        },

        ...('pdfLogo' in imagesDict
          ? [
              {
                image: 'pdfLogo',
                width: 170,
                height: 170,
                alignment: 'center' as const,
                margin: [0, 40, 0, 28],
              },
            ]
          : [
              {
                text: '☕',
                fontSize: PDF_CONFIG.portada.emojiSize,
                alignment: 'center' as const,
                color: colors.primary,
                margin: [0, 50, 0, 28],
              },
            ]),

        // ── Línea decorativa antes del título ────────────────────────
        {
          canvas: [
            {
              type: 'line' as const,
              x1: PDF_CONFIG.decorativeLine.x1,
              y1: 0,
              x2: PDF_CONFIG.decorativeLine.x2,
              y2: 0,
              lineWidth: 0.6,
              lineColor: colors.textMuted,
            },
          ],
          margin: [0, 0, 0, 16],
        },

        {
          text: 'COFFEE HOUSE',
          style: 'coverTitle',
          margin: [0, 0, 0, 10],
        },

        {
          text: 'Menú de Especialidades',
          style: 'coverSubtitle',
          margin: [0, 0, 0, 20],
        },

        // ── Líneas decorativas dobles ────────────────────────────────
        {
          canvas: [
            {
              type: 'line' as const,
              x1: PDF_CONFIG.decorativeLine.x1,
              y1: 0,
              x2: PDF_CONFIG.decorativeLine.x2,
              y2: 0,
              lineWidth: PDF_CONFIG.decorativeLine.lineWidth,
              lineColor: colors.primary,
            },
            {
              type: 'line' as const,
              x1: PDF_CONFIG.decorativeLine.x1 + 40,
              y1: PDF_CONFIG.decorativeLine.lineSpacing,
              x2: PDF_CONFIG.decorativeLine.x2 - 40,
              y2: PDF_CONFIG.decorativeLine.lineSpacing,
              lineWidth: PDF_CONFIG.decorativeLine.secondLineWidth,
              lineColor: colors.textMuted,
            },
          ],
          margin: [0, 0, 0, 70],
        },

        // ── Etiquetas descriptivas centradas ───────────────────────────
        {
          columns: [
            { text: '✦ Ingredientes frescos', fontSize: 9, color: colors.textMuted, italics: true, alignment: 'center' },
            { text: '✦ Preparación artesanal', fontSize: 9, color: colors.textMuted, italics: true, alignment: 'center' },
            { text: '✦ Atmósfera acogedora', fontSize: 9, color: colors.textMuted, italics: true, alignment: 'center' },
          ],
          margin: [0, 0, 0, 50],
        },

        // ── Marco decorativo inferior portada ────────────────────────
        {
          canvas: [
            {
              type: 'line' as const,
              x1: 0, y1: 0, x2: 515, y2: 0,
              lineWidth: 3,
              lineColor: colors.primary,
            },
          ],
          margin: [0, 0, 0, 0],
          pageBreak: 'after' as const,
        },

        ...menuContent,
      ],

      styles: this.buildStylesDark(colors),
      defaultStyle: {
        fontSize: PDF_CONFIG.default.fontSize,
        color: colors.text,
        lineHeight: PDF_CONFIG.default.lineHeight,
      },

      background: (_currentPage: number, pageSizeCtx: { width: number; height: number }) =>
        'pdfBg' in imagesDict
          ? {
              image: 'pdfBg',
              width: pageSizeCtx.width,
              height: pageSizeCtx.height,
              absolutePosition: { x: 0, y: 0 },
            }
          : {
              canvas: [
                {
                  type: 'rect' as const,
                  x: 0,
                  y: 0,
                  w: pageSizeCtx.width,
                  h: pageSizeCtx.height,
                  color: colors.bgDark,
                },
              ],
            },

      info: {
        title: 'Menu - Coffee House',
        author: 'Coffee House',
        subject: 'Menu de Productos',
        keywords: 'cafe, menu, coffee house, especialidad',
        creator: 'Coffee House App',
        creationDate: new Date(),
      },      // Diccionario de imágenes: pdfmake las carga por clave, evita errores de formato
      images: imagesDict,    };
  }

  private buildFooterDark(
    currentPage: number,
    pageCount: number,
    colors: { textMuted: string; primary: string }
  ) {
    return {
      stack: [
        {
          canvas: [
            {
              type: 'line' as const,
              x1: 0, y1: 0, x2: 515, y2: 0,
              lineWidth: 0.6,
              lineColor: colors.primary,
            },
          ],
        },
        {
          columns: [
            {
              text: `© ${new Date().getFullYear()} Coffee House`,
              fontSize: PDF_CONFIG.footer.fontSize,
              color: colors.textMuted,
              alignment: 'left',
            },
            {
              text: `${currentPage} / ${pageCount}`,
              fontSize: PDF_CONFIG.footer.fontSize,
              color: colors.textMuted,
              alignment: 'right',
            },
          ],
          margin: [0, 5, 0, 0],
        },
      ],
      margin: [40, 6, 40, 0],
    };
  }

  private buildMenuContentDark(
    menuData: MenuStructure[],
    colors: PdfColors,
    imagesDict: Record<string, string> = {}
  ): any[] {
    const content: any[] = [];

    menuData.forEach((category, categoryIndex) => {
      if (categoryIndex > 0) {
        content.push({ text: '', pageBreak: 'before' as const });
      }

      // ── Banner de categoría ──────────────────────────────────────
      content.push({
        table: {
          widths: ['*'],
          body: [[
            {
              text: category.name.toUpperCase(),
              fontSize: PDF_CONFIG.content.categoryTitleSize,
              bold: true,
              color: '#FFFFFF',
              alignment: 'center' as const,
              characterSpacing: 3,
              margin: [0, 11, 0, 11],
              fillColor: colors['primary'],
            },
          ]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 14],
      });

      if (category.description) {
        content.push({
          text: category.description,
          fontSize: PDF_CONFIG.content.descriptionSize,
          color: colors['textMuted'],
          margin: [4, 0, 0, 10],
          italics: true,
        });
      }

      // Mostrar productos asociados directamente a la categoría
      if (category.products && category.products.length > 0) {
        content.push(
          this.buildProductsTableDark(category.products, colors, imagesDict),
          { text: '', margin: [0, 0, 0, 16] }
        );
      }

      category.subcategories.forEach((subcategory) => {
        if (subcategory.products.length > 0) {
          // ── Encabezado de subcategoría con acento izquierdo ──────
          content.push(
            {
              columns: [
                {
                  canvas: [
                    {
                      type: 'rect' as const,
                      x: 0, y: 0, w: 4, h: 18,
                      r: 2,
                      color: colors['primary'],
                    },
                  ],
                  width: 12,
                },
                {
                  text: subcategory.name,
                  style: 'subcategoryTitle',
                  margin: [4, 1, 0, 0],
                },
              ],
              margin: [0, 8, 0, 10],
            },
            this.buildProductsTableDark(subcategory.products, colors, imagesDict),
            { text: '', margin: [0, 0, 0, 16] }
          );
        }
      });
    });

    return content;
  }

  private buildProductsTableDark(
    products: Product[],
    colors: PdfColors,
    imagesDict: Record<string, string> = {}
  ): any {
    /** Construye la tarjeta individual de un producto */
    const buildCard = (product: Product | null): any => {
      if (!product) {
        // Celda vacía transparente para completar la fila
        return { text: '', margin: [0, 0, 0, 0] };
      }

      const imageKey = `product_${product.id}`;
      const hasImage = imageKey in imagesDict;

      const imageCell: any = hasImage
        ? { image: imageKey, width: 62, height: 62, margin: [7, 7, 6, 7] }
        : {
            canvas: [
              { type: 'rect' as const, x: 0, y: 0, w: 62, h: 62, r: 4, color: colors['bgDark'] },
              { type: 'line' as const, x1: 20, y1: 31, x2: 42, y2: 31, lineWidth: 1.5, lineColor: colors['textMuted'] },
              { type: 'line' as const, x1: 31, y1: 20, x2: 31, y2: 42, lineWidth: 1.5, lineColor: colors['textMuted'] },
            ],
            width: 62,
            margin: [7, 7, 6, 7],
          };

      const infoStack: any[] = [
        {
          text: product.name,
          fontSize: 10,
          bold: true,
          color: colors['text'],
          margin: [0, 0, 0, 3],
        },
      ];

      if (product.description) {
        infoStack.push({
          text: product.description,
          fontSize: 7.5,
          color: colors['textMuted'],
          italics: true,
          margin: [0, 0, 0, 5],
          lineHeight: 1.3,
        });
      }

      // Precio con símbolo decorativo
      infoStack.push({
        text: `$ ${product.price?.toLocaleString('es-CO') ?? '0'}`,
        fontSize: 12,
        bold: true,
        color: colors['primary'],
      });

      return {
        table: {
          widths: [76, '*'],
          body: [[imageCell, { stack: infoStack, margin: [0, 8, 8, 6] }]],
        },
        layout: {
          fillColor: () => colors['bgGray'],
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 1 : 0,
          vLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.widths.length ? 1 : 0,
          hLineColor: () => colors['primary'],
          vLineColor: () => colors['primary'],
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      };
    };

    // ── Grid de 2 columnas ───────────────────────────────────────────
    const rows: any[] = [];
    for (let i = 0; i < products.length; i += 2) {
      const p1 = products[i];
      const p2 = products[i + 1] ?? null;
      rows.push({
        columns: [
          { width: '*', stack: [buildCard(p1)], margin: [0, 0, 4, 0] },
          { width: '*', stack: [buildCard(p2)], margin: [4, 0, 0, 0] },
        ],
        margin: [0, 0, 0, 8],
      });
    }

    return { stack: rows };
  }

  private buildStylesDark(colors: PdfColors): Record<string, object> {
    return {
      categoryTitleDark: {
        fontSize: PDF_CONFIG.content.categoryTitleSize,
        bold: true,
        color: '#FFFFFF',
        characterSpacing: 3,
        alignment: 'center',
      },
      subcategoryTitle: {
        fontSize: 11,
        bold: true,
        color: colors['primary'],
      },
      productName: {
        fontSize: 10,
        bold: true,
        color: colors['text'],
      },
      productDescription: {
        fontSize: PDF_CONFIG.content.descriptionSize,
        color: colors['textMuted'],
        italics: true,
        lineHeight: 1.3,
      },
      price: {
        fontSize: 12,
        bold: true,
        color: colors['primary'],
      },
      coverTitle: {
        fontSize: PDF_CONFIG.portada.titleSize,
        bold: true,
        characterSpacing: 4,
        color: colors['text'],
        alignment: 'center',
      },
      coverSubtitle: {
        fontSize: PDF_CONFIG.portada.subtitleSize,
        italics: true,
        color: colors['primary'],
        alignment: 'center',
      },
    };
  }

  private mapThemeColorsToPdf(theme: any): PdfColors {
    const isDark = theme.id === 'dark';
    return {
      bgDark: isDark ? theme.colors.background : theme.colors.backgroundLight,
      bgGray: isDark ? theme.colors.surface : theme.colors.backgroundLight,
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      text: theme.colors.text,
      textMuted: theme.colors.textSecondary,
    };
  }
}
