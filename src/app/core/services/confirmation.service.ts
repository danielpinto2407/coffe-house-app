import { Injectable, signal } from '@angular/core';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private readonly showDialog = signal(false);
  private readonly dialogData = signal<ConfirmationDialogData | null>(null);
  private resolveConfirm: ((value: boolean) => void) | null = null;

  readonly isOpen = this.showDialog.asReadonly();
  readonly data = this.dialogData.asReadonly();

  /**
   * Abre el diálogo de confirmación y retorna una promesa
   */
  async confirm(data: ConfirmationDialogData): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveConfirm = resolve;
      this.dialogData.set(data);
      this.showDialog.set(true);
    });
  }

  /**
   * Confirma la acción y cierra el diálogo
   */
  confirmAction(): void {
    if (this.resolveConfirm) {
      this.resolveConfirm(true);
    }
    this.close();
  }

  /**
   * Cancela la acción y cierra el diálogo
   */
  cancelAction(): void {
    if (this.resolveConfirm) {
      this.resolveConfirm(false);
    }
    this.close();
  }

  /**
   * Cierra el diálogo sin resolver
   */
  private close(): void {
    this.showDialog.set(false);
    this.dialogData.set(null);
    this.resolveConfirm = null;
  }
}
