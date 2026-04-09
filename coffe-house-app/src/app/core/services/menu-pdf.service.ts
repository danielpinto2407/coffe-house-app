import { Injectable, signal, inject } from '@angular/core';
import type { Content } from 'pdfmake/interfaces';
import { MenuStructure } from '../../features/menu/models/menu-structure.model';
import { Product } from '../../features/menu/models/product.model';
import { ThemeService } from './theme.service';
import { ThemeConfig } from '../themes/theme.config';

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

      let logoBase64 = this.cachedLogo();
      if (!logoBase64) {
        try {
          logoBase64 = await this.loadAndValidateLogo('assets/img/logo.png');
          if (logoBase64) {
            this.cachedLogo.set(logoBase64);
          }
        } catch (error) {
          console.warn('Logo loading failed, continuing without it', error);
        }
      }

      let bgImageBase64 = this.cachedBgImage();
      const bgPath = this.bgImagePath();
      if (!bgImageBase64 && bgPath) {
        try {
          bgImageBase64 = await this.loadAndValidateLogo(bgPath);
          if (bgImageBase64) {
            this.cachedBgImage.set(bgImageBase64);
          }
        } catch (error) {
          console.warn('Background image loading failed, using solid color', error);
        }
      }

      const docDefinition = this.buildPdfDefinition(menuData, logoBase64, bgImageBase64);
      const pdfMake = await getPdfMake();
      const pdf = pdfMake.createPdf(docDefinition);

      return await this.exportPdf(pdf, fileName, format);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to generate menu PDF';
      console.error('Error generating PDF:', error);
      this.pdfError.set(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.isGenerating.set(false);
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

  private async loadAndValidateLogo(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load logo: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid logo MIME type: ${contentType}`);
    }

    const blob = await response.blob();

    if (blob.size > PDF_CONFIG.logo.maxSize * 1024) {
      console.warn(
        `Logo size ${blob.size / 1024}KB exceeds max ${PDF_CONFIG.logo.maxSize}KB, skipping`
      );
      return '';
    }

    return this.blobToBase64(blob);
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
    bgImageBase64: string = ''
  ): any {
    const currentTheme = this.themeService.currentTheme();
    const colors = this.mapThemeColorsToPdf(currentTheme);
    const { pageSize, pageMargins } = PDF_CONFIG;

    return {
      pageSize,
      pageMargins,
      footer: (currentPage: number, pageCount: number) =>
        this.buildFooterDark(currentPage, pageCount, colors) as Content,
      content: [
        ...(logoBase64
          ? [
              {
                image: logoBase64,
                width: PDF_CONFIG.logo.width,
                height: PDF_CONFIG.logo.height,
                alignment: 'center' as const,
                margin: [0, 30, 0, 30],
              },
            ]
          : [
              {
                text: '☕',
                fontSize: PDF_CONFIG.portada.emojiSize,
                alignment: 'center' as const,
                color: colors.primary,
                margin: [0, 40, 0, 30],
              },
            ]),

        {
          text: 'COFFEE HOUSE',
          fontSize: PDF_CONFIG.portada.titleSize,
          alignment: 'center' as const,
          color: colors.text,
          margin: [0, 0, 0, 30],
          characterSpacing: 2,
        },

        {
          text: 'Menu de Especialidades',
          fontSize: PDF_CONFIG.portada.subtitleSize,
          alignment: 'center' as const,
          color: colors.primary,
          margin: [0, 0, 0, PDF_CONFIG.portada.subtitleMargin],
          italics: true,
        },

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
          margin: [0, 0, 0, 20],
        },

        {
          text: 'Ingredientes frescos - Preparacion artesanal - Atmosfera acogedora',
          fontSize: 9,
          alignment: 'center' as const,
          color: colors.textMuted,
          italics: true,
          margin: [0, 0, 0, 0],
          pageBreak: 'after' as const,
        },

        ...(this.buildMenuContentDark(menuData, colors) as Content[]),
      ],

      styles: this.buildStylesDark(colors),
      defaultStyle: {
        fontSize: PDF_CONFIG.default.fontSize,
        color: colors.text,
        lineHeight: PDF_CONFIG.default.lineHeight,
      },

      background: (_currentPage: number, pageSizeCtx: { width: number; height: number }) =>
        bgImageBase64
          ? {
              image: bgImageBase64,
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
      },
    };
  }

  private buildFooterDark(
    currentPage: number,
    pageCount: number,
    colors: { textMuted: string; primary: string }
  ) {
    return {
      columns: [
        {
          text: `© ${new Date().getFullYear()} Coffee House`,
          fontSize: PDF_CONFIG.footer.fontSize,
          color: colors.textMuted,
          alignment: 'center',
        },
        { text: '', flex: 1 },
        {
          text: `${currentPage} / ${pageCount}`,
          fontSize: PDF_CONFIG.footer.fontSize,
          color: colors.textMuted,
          alignment: 'center',
        },
      ],
      margin: [0, 10, 0, 10],
    };
  }

  private buildMenuContentDark(
    menuData: MenuStructure[],
    colors: PdfColors
  ): any[] {
    const content: any[] = [];

    menuData.forEach((category, categoryIndex) => {
      if (categoryIndex > 0) {
        content.push({ text: '', pageBreak: 'before' as const });
      }

      content.push(
        {
          text: category.name.toUpperCase(),
          style: 'categoryTitleDark',
          margin: [0, 0, 0, 10],
        },
        {
          canvas: [
            {
              type: 'line' as const,
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: PDF_CONFIG.content.dottedLineWidth,
              lineColor: colors['primary'],
              dash: { length: 3, space: 3 },
            },
          ],
          margin: [0, 0, 0, 12],
        }
      );

      if (category.description) {
        content.push({
          text: category.description,
          fontSize: PDF_CONFIG.content.descriptionSize,
          color: colors['textMuted'],
          margin: [0, 0, 0, 10],
          italics: true,
        });
      }

      category.subcategories.forEach((subcategory) => {
        if (subcategory.products.length > 0) {
          content.push(
            {
              canvas: [
                {
                  type: 'line' as const,
                  x1: 0,
                  y1: 0,
                  x2: 515,
                  y2: 0,
                  lineWidth: PDF_CONFIG.content.productLineWidth,
                  lineColor: colors['primary'],
                },
              ],
              margin: [0, 0, 0, 8],
            },
            {
              text: subcategory.name,
              style: 'subcategoryTitle',
              margin: [0, 0, 0, 6],
            },
            {
              canvas: [
                {
                  type: 'line' as const,
                  x1: 0,
                  y1: 0,
                  x2: 515,
                  y2: 0,
                  lineWidth: PDF_CONFIG.content.productLineWidth,
                  lineColor: colors['primary'],
                },
              ],
              margin: [0, 0, 0, 10],
            },
            this.buildProductsTableDark(subcategory.products, colors),
            { text: '', margin: [0, 0, 0, 16] }
          );
        }
      });
    });

    return content;
  }

  private buildProductsTableDark(
    products: Product[],
    colors: PdfColors
  ): any {
    const rows: any[] = [];

    products.forEach((product) => {
      rows.push({
        columns: [
          {
            text: product.name,
            fontSize: 11,
            color: colors['text'],
            width: '60%',
          },
          {
            text: `$${product.price?.toLocaleString('es-CO') ?? '0'}`,
            fontSize: 11,
            color: colors['primary'],
            alignment: 'right',
            width: '40%',
          },
        ],
        margin: [0, 0, 0, 2],
      });

      if (product.description) {
        rows.push({
          text: product.description,
          fontSize: 9,
          color: colors['textMuted'],
          italics: true,
          margin: [0, 0, 0, 8],
        });
      }

      rows.push({
        canvas: [
          {
            type: 'line' as const,
            x1: 0,
            y1: 0,
            x2: 450,
            y2: 0,
            lineWidth: PDF_CONFIG.content.productLineWidth,
            lineColor: colors['bgGray'],
          },
        ],
        margin: [0, 0, 0, 8],
      });
    });

    return { stack: rows };
  }

  private buildStylesDark(colors: PdfColors): Record<string, object> {
    return {
      categoryTitleDark: {
        fontSize: PDF_CONFIG.content.categoryTitleSize,
        color: colors['text'],
        characterSpacing: 2,
      },
      subcategoryTitle: {
        fontSize: 12,
        color: colors['primary'],
        italics: true,
      },
      productName: {
        fontSize: 11,
        color: colors['text'],
      },
      productDescription: {
        fontSize: PDF_CONFIG.content.descriptionSize,
        color: colors['textMuted'],
        italics: true,
      },
      price: {
        fontSize: 11,
        color: colors['primary'],
        alignment: 'right',
      },
    };
  }

  private mapThemeColorsToPdf(theme: ThemeConfig): PdfColors {
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
