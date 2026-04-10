import { Component, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageMonitoringService } from '../../core/services/storage-monitoring.service';
import { FormatBytesPipe } from '../../core/pipes/format-bytes.pipe';

/**
 * ✅ Widget de indicador de almacenamiento para admin
 * Muestra:
 * - Porcentaje de uso actual
 * - Barra de progreso visual
 * - Advertencias si está cerca del límite (80%)
 * - Usado / Total en bytes formateados
 */
@Component({
  selector: 'app-storage-indicator',
  standalone: true,
  imports: [CommonModule, FormatBytesPipe],
  template: `
    <div class="storage-widget">
      <!-- Título -->
      <div class="widget-header">
        <h3 class="title">📊 Almacenamiento</h3>
        <button 
          class="refresh-btn"
          (click)="refreshStorage()"
          [disabled]="storage.isLoading()"
          title="Actualizar estadísticas">
          {{ storage.isLoading() ? '⏳' : '🔄' }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="storage.isLoading()" class="loading-state">
        ⏳ Cargando...
      </div>

      <!-- Stats Display -->
      <div *ngIf="!storage.isLoading() && storage.storageStats()" class="stats-container">
        <!-- Barra de progreso -->
        <div class="progress-section">
          <div class="progress-bar-wrapper">
            <div 
              class="progress-bar"
              [ngClass]="getProgressClass()"
              [style.width.%]="storage.usagePercentage()">
            </div>
          </div>
          <div class="percentage-text">
            {{ storage.usagePercentage() | number:'1.1-1' }}%
          </div>
        </div>

        <!-- Detalles de bytes -->
        <div class="stats-details">
          <div class="stat-item">
            <span class="stat-label">Usado:</span>
            <span class="stat-value">
              {{ storage.storageStats()?.usedBytes | formatBytes }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Límite:</span>
            <span class="stat-value">
              {{ storage.storageStats()?.limitBytes | formatBytes }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Disponible:</span>
            <span class="stat-value" [ngClass]="{ 'warning': storage.isNearLimit() }">
              {{ getAvailableBytes() | formatBytes }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Archivos:</span>
            <span class="stat-value">
              {{ storage.storageStats()?.filesCount }}
            </span>
          </div>
        </div>

        <!-- Estado/Alerta -->
        <div class="status-container">
          <div 
            class="status-badge"
            [ngClass]="getStatusClass()">
            {{ getStatusIcon() }} {{ getStatusText() }}
          </div>
          
          <!-- Mensaje de alerta si aplica -->
          <div 
            *ngIf="storage.isNearLimit()"
            class="warning-message">
            ⚠️ {{ warningMessage() }}
          </div>
        </div>

        <!-- Última actualización -->
        <div class="last-updated">
          Actualizado: {{ getLastUpdated() }}
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!storage.isLoading() && !storage.storageStats()" class="error-state">
        ❌ Error al cargar estadísticas
      </div>
    </div>
  `,
  styles: [`
    .storage-widget {
      background: linear-gradient(135deg, var(--color-primary, #8B4513) 0%, var(--color-secondary, #D2B48C) 100%);
      border-radius: 12px;
      padding: 1.5rem;
      color: var(--color-text, #1a1a1a);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .refresh-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: var(--color-text, #1a1a1a);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 1rem;
      opacity: 0.7;
    }

    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-bar-wrapper {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .progress-bar.warning {
      background: linear-gradient(90deg, #FF9800, #FFC107);
    }

    .progress-bar.critical {
      background: linear-gradient(90deg, #F44336, #E91E63);
    }

    .percentage-text {
      font-weight: 600;
      min-width: 50px;
      text-align: right;
    }

    .stats-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .stat-label {
      opacity: 0.8;
    }

    .stat-value {
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    .stat-value.warning {
      color: #FFC107;
    }

    .status-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .status-badge {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      text-align: center;
    }

    .status-badge.ok {
      background: rgba(76, 175, 80, 0.2);
      color: #4CAF50;
    }

    .status-badge.warning {
      background: rgba(255, 152, 0, 0.2);
      color: #FF9800;
    }

    .status-badge.critical {
      background: rgba(244, 67, 54, 0.2);
      color: #F44336;
    }

    .warning-message {
      padding: 0.75rem;
      background: rgba(255, 193, 7, 0.15);
      border-left: 3px solid #FFC107;
      border-radius: 4px;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .last-updated {
      text-align: center;
      font-size: 0.75rem;
      opacity: 0.6;
      margin-top: 0.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageIndicatorComponent implements OnInit {
  protected readonly storage = inject(StorageMonitoringService);

  protected readonly warningMessage = computed(() => {
    const warning = this.storage.getStorageWarning();
    return warning.substring(warning.indexOf(':') + 1).trim() || 'Almacenamiento normal';
  });

  ngOnInit(): void {
    this.refreshStorage();
  }

  async refreshStorage(): Promise<void> {
    try {
      await this.storage.getStorageStats();
    } catch (error) {
      console.error('Error actualizando almacenamiento:', error);
    }
  }

  getProgressClass(): string {
    const percentage = this.storage.usagePercentage();
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return '';
  }

  getAvailableBytes(): number {
    const stats = this.storage.storageStats();
    if (!stats) return 0;
    return Math.max(0, stats.limitBytes - stats.usedBytes);
  }

  getStatusClass(): string {
    const percentage = this.storage.usagePercentage();
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'ok';
  }

  getStatusIcon(): string {
    const percentage = this.storage.usagePercentage();
    if (percentage >= 95) return '🔴';
    if (percentage >= 80) return '🟡';
    return '🟢';
  }

  getStatusText(): string {
    const percentage = this.storage.usagePercentage();
    if (percentage >= 95) return 'CRÍTICO';
    if (percentage >= 80) return 'ALERTA';
    if (percentage >= 50) return 'NORMAL';
    return 'ÓPTIMO';
  }

  getLastUpdated(): string {
    const lastUpdated = this.storage.lastUpdated();
    if (!lastUpdated) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'Hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  }
}
