import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { TrashStore } from '../store/trash.store';
import { TrashService } from '../services/trash.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { TrashEntry, TRASH_TYPE_LABELS, trashEntryName } from '../models/trash.model';

/**
 * Papelera (Spec: Trash UI — "Admin views trash").
 *
 * Lista las entradas NO restauradas con su tipo, nombre original, fecha de
 * eliminación y fecha límite de restauración, y permite:
 *  - Restaurar: limpia los campos de soft-delete del documento ORIGINAL.
 *  - Eliminar permanentemente: borra la entrada y, si aún existe, el original.
 *
 * Componente standalone: se abre como MatDialog desde el toolbar (openTrash,
 * 900px / maxWidth 96vw) y también se carga lazy vía `loadComponent` en la
 * ruta /trash (deep-link fallback con guards).
 *
 * Las entradas cuyo original fue hard-deleted muestran `restoreError` (409)
 * y permiten reintentar o eliminarlas definitivamente.
 */
@Component({
  selector: 'app-trash-list',
  standalone: true,
  templateUrl: './trash-list.component.html',
  styleUrls: ['./trash-list.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatTableModule,
  ],
})
export class TrashListComponent implements OnInit {
  readonly entries = this.store.nonRestored;
  readonly loading = this.store.loading;
  readonly busyEntryId = this.store.busyEntryId;
  readonly error = this.store.error;
  readonly typeLabels = TRASH_TYPE_LABELS;
  readonly displayedColumns = ['type', 'name', 'deletedAt', 'restoreUntil', 'state', 'actions'];

  constructor(
    readonly store: TrashStore,
    private trashService: TrashService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
  ) { }

  async ngOnInit(): Promise<void> {
    if (this.store.entries().length === 0) {
      await this.loadEntries();
    }
  }

  async loadEntries(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const entries = await lastValueFrom(this.trashService.getTrashEntries());
      this.store.setEntries(entries);
    } catch (err: any) {
      this.store.setError(err?.error?.message ?? 'Error al cargar la papelera');
      this.notificationService.error('No se pudieron cargar los elementos de la papelera');
    } finally {
      this.store.setLoading(false);
    }
  }

  entryName(entry: TrashEntry): string {
    return trashEntryName(entry);
  }

  isExpired(entry: TrashEntry): boolean {
    return new Date(entry.restoreUntil).getTime() < Date.now();
  }

  async restore(entry: TrashEntry): Promise<void> {
    this.store.setBusyEntryId(entry._id);
    try {
      const restored = await lastValueFrom(this.trashService.restore(entry._id));
      this.store.removeEntry(entry._id);
      this.notificationService.success(
        `${this.typeLabels[entry.type]} "${this.entryName(entry)}" restaurado correctamente`,
      );
      void restored;
    } catch (err: any) {
      // 409: el original fue hard-deleted. El backend marca restoreError en la
      // entrada; recargamos para que la entrada muestre el estado de error.
      if (err?.status === 409) {
        await this.loadEntries();
        this.notificationService.error(
          err?.error?.message ?? 'No se pudo restaurar: el documento original ya no existe',
          'Entendido',
        );
      } else {
        this.notificationService.error(
          err?.error?.message ?? 'Error al restaurar el elemento',
        );
      }
    } finally {
      this.store.setBusyEntryId(null);
    }
  }

  async permanentlyDelete(entry: TrashEntry): Promise<void> {
    const name = this.entryName(entry);
    const confirmed = await this.confirm(
      'Eliminar permanentemente',
      `¿Eliminar definitivamente "${name}"? También se borrará el documento original si aún existe. Esta acción no se puede deshacer.`,
      'Eliminar definitivamente',
    );
    if (!confirmed) return;

    this.store.setBusyEntryId(entry._id);
    try {
      await lastValueFrom(this.trashService.permanentlyDelete(entry._id));
      this.store.removeEntry(entry._id);
      this.notificationService.success('Elemento eliminado permanentemente');
    } catch (err: any) {
      this.notificationService.error(
        err?.error?.message ?? 'Error al eliminar el elemento',
      );
    } finally {
      this.store.setBusyEntryId(null);
    }
  }

  private confirm(title: string, message: string, confirmText: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      data: { title, message, confirmText, cancelText: 'Cancelar' },
    });
    return lastValueFrom(dialogRef.afterClosed());
  }
}
