import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportsStore } from '../store/imports.store';

/**
 * Vista de confirmación de la importación masiva (Spec: Bulk Import — confirm).
 * Muestra el resultado por fila (rowNumber/status/message), los totales y el
 * id del ImportLog registrado con status `completado` (lowercase).
 */
@Component({
  selector: 'app-import-confirm',
  standalone: false,
  templateUrl: './import-confirm.component.html',
  styleUrls: ['./import-confirm.component.scss'],
})
export class ImportConfirmComponent implements OnInit {
  successCount = 0;
  duplicateCount = 0;
  errorCount = 0;

  constructor(
    readonly store: ImportsStore,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const result = this.store.confirmResult();
    if (!result) {
      void this.router.navigate(['..'], { relativeTo: this.route });
      return;
    }
    this.successCount = result.results.filter((r) => r.status === 'success').length;
    this.duplicateCount = result.results.filter((r) => r.status === 'duplicate').length;
    this.errorCount = result.results.filter((r) => r.status === 'error').length;
  }

  statusClass(status: string): string {
    return `import-status-${status}`;
  }

  newImport(): void {
    this.store.reset();
    void this.router.navigate(['..'], { relativeTo: this.route });
  }
}