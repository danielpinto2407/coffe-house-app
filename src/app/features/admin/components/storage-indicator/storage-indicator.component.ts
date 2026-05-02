import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { StorageMonitoringService } from '../../../../core/services/storage-monitoring.service';
import { FormatBytesPipe } from '../../../../core/pipes/format-bytes.pipe';
import { interval } from 'rxjs';

@Component({
  selector: 'app-storage-indicator',
  standalone: true,
  imports: [CommonModule, FormatBytesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 rounded-xl border border-border bg-surface">
      <!-- Encabezado -->
      <div class="flex items-center gap-3 mb-4">
        <span class="material-icons text-accent text-2xl">storage</span>
        <h3 class="text-xl font-semibold text-text">Almacenamiento</h3>
        <button
          type="button"
          (click)="onRefresh()"
          [disabled]="isLoading()"
          class="ml-auto p-2 rounded-lg hover:bg-border transition duration-200 disabled:opacity-50">
          <span class="material-icons text-lg">{{ isLoading() ? 'hourglass_empty' : 'refresh' }}</span>
        </button>
      </div>

      <!-- Contenido -->
      @if (stats()) {
        <!-- Estadísticas -->
        <div class="space-y-4">
          <!-- Barra de progreso -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">{{ (stats()?.usedBytes ?? 0) | formatBytes }}</span>
              <span class="text-text-secondary font-semibold">
                {{ usagePercentage() | number: '1.0-0' }}% de 1GB
              </span>
            </div>
            
            <!-- Barra con color dinámico -->
            <div class="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                [ngClass]="{
                  'bg-success': usagePercentage() < 50,
                  'bg-warning': usagePercentage() >= 50 && usagePercentage() < 80,
                  'bg-error': usagePercentage() >= 80
                }"
                [style.width.%]="usagePercentage()">
              </div>
            </div>
          </div>

          <!-- Detalles -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 bg-border rounded-lg">
              <p class="text-text-secondary mb-1">Usado</p>
              <p class="font-semibold text-text">{{ (stats()?.usedBytes ?? 0) | formatBytes }}</p>
            </div>
            <div class="p-3 bg-border rounded-lg">
              <p class="text-text-secondary mb-1">Disponible</p>
              <p class="font-semibold text-text">{{ remainingBytes() | formatBytes }}</p>
            </div>
            <div class="p-3 bg-border rounded-lg">
              <p class="text-text-secondary mb-1">Archivos</p>
              <p class="font-semibold text-text">{{ stats()?.filesCount || 0 }}</p>
            </div>
            <div class="p-3 bg-border rounded-lg">
              <p class="text-text-secondary mb-1">Promedio/Archivo</p>
              <p class="font-semibold text-text">{{ (stats()?.averageFileSize ?? 0) | formatBytes }}</p>
            </div>
          </div>

          <!-- Alertas -->
          @if (warningMessage()) {
            <div 
              class="p-3 rounded-lg text-sm font-medium flex items-start gap-2"
              [ngClass]="warningClass()">
              <span class="material-icons text-lg flex-shrink-0">{{ warningIcon() }}</span>
              <p class="flex-1">{{ warningMessage() }}</p>
            </div>
          }

          <!-- Última actualización -->
          <p class="text-xs text-text-secondary text-center">
            @if (lastUpdated()) {
              Última actualización: {{ lastUpdated() | date: 'short' }}
            }
          </p>
        </div>
      } @else if (!isLoading()) {
        <button
          type="button"
          (click)="onRefresh()"
          class="w-full py-3 text-center text-primary font-medium rounded-lg hover:bg-border transition duration-200">
          Cargar estadísticas
        </button>
      } @else {
        <div class="flex items-center justify-center py-8">
          <span class="material-icons animate-spin text-accent text-2xl">hourglass_empty</span>
          <p class="ml-2 text-text-secondary">Cargando datos...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class StorageIndicatorComponent implements OnInit {
  private readonly storageMonitoring = inject(StorageMonitoringService);

  protected readonly stats = computed(() => this.storageMonitoring.storageStats());
  protected readonly isLoading = computed(() => this.storageMonitoring.isLoading());
  protected readonly lastUpdated = computed(() => this.storageMonitoring.lastUpdated());
  protected readonly usagePercentage = computed(() => 
    this.storageMonitoring.usagePercentage()
  );

  protected readonly remainingBytes = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Math.max(0, s.limitBytes - s.usedBytes);
  });

  protected readonly warningMessage = computed(() => 
    this.storageMonitoring.getStorageWarning()
  );

  protected readonly warningClass = computed(() => {
    const percentage = this.usagePercentage();
    
    if (percentage >= 95) {
      return 'bg-error/20 text-error border border-error';
    }
    
    if (percentage >= 80) {
      return 'bg-warning/20 text-warning border border-warning';
    }
    
    if (percentage >= 50) {
      return 'bg-accent/20 text-accent border border-accent';
    }
    
    return '';
  });

  protected readonly warningIcon = computed(() => {
    const percentage = this.usagePercentage();
    
    if (percentage >= 95) return 'error';
    if (percentage >= 80) return 'warning';
    if (percentage >= 50) return 'info';
    
    return '';
  });

  ngOnInit(): void {
    // Cargar estadísticas al inicializar
    this.onRefresh();
  }

  async onRefresh(): Promise<void> {
    try {
      await this.storageMonitoring.getStorageStats();
    } catch (error) {
      console.error('Error al actualizar estadísticas:', error);
    }
  }
}
