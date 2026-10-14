import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { ImportsStore } from '../store/imports.store';
import { ImportsService } from '../services/imports.service';
import { LocalPreviewRow } from '../models/import.model';
import { CourseService } from '@core/services/course.service';

const MAX_FILE_MB = 5;
const REQUIRED_COLUMNS = ['dni', 'names', 'lastNames', 'institutionalEmail'];

/**
 * Vista de preview de la importación masiva (Spec: Bulk Import).
 *
 * - El archivo se parsea LOCALMENTE con `xlsx` para mostrar las primeras
 *   filas al instante (diseño: "frontend local preview with xlsx").
 * - El endpoint de preview del backend devuelve el resumen autoritativo
 *   (total/valid/duplicate/error + hasta 10 filas validadas).
 * - Confirmar navega a la vista de confirmación, que ejecuta el endpoint
 *   `confirm` con el archivo (create-or-update + inscripción + ImportLog).
 */
@Component({
  selector: 'app-import-preview',
  standalone: false,
  templateUrl: './import-preview.component.html',
  styleUrls: ['./import-preview.component.scss'],
})
export class ImportPreviewComponent implements OnInit {
  constructor(
    readonly store: ImportsStore,
    private route: ActivatedRoute,
    private router: Router,
    private importsService: ImportsService,
    private courseService: CourseService,
  ) {}

  async ngOnInit(): Promise<void> {
    const courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    if (courseId !== this.store.courseId()) {
      this.store.reset();
      this.store.setCourse(courseId, '');
      await this.loadCourseName(courseId);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const validationError = this.validateFile(file);
    if (validationError) {
      this.store.setError(validationError);
      return;
    }

    this.store.setError(null);
    this.store.setFile(file);
    void this.parseLocally(file).then(() => this.loadServerPreview(file));
  }

  async confirm(): Promise<void> {
    const file = this.store.file();
    if (!file) {
      return;
    }

    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const result = await lastValueFrom(
        this.importsService.confirmImport(file, this.store.courseId()),
      );
      this.store.setConfirmResult(result);
      await this.router.navigate(['confirm'], { relativeTo: this.route });
    } catch (error: any) {
      this.store.setError(error?.error?.message ?? 'Error al confirmar la importación');
    } finally {
      this.store.setLoading(false);
    }
  }

  private validateFile(file: File): string | null {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'csv') {
      return 'Solo se permiten archivos .xlsx o .csv';
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `El archivo supera el tamaño máximo de ${MAX_FILE_MB}MB`;
    }
    return null;
  }

  private async parseLocally(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rawRows: unknown[][] = sheetName
        ? (XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
            defval: '',
          }) as unknown[][])
        : [];

      const headerIndex = rawRows.findIndex((row) =>
        REQUIRED_COLUMNS.every((col) =>
          row.some((cell) => String(cell ?? '').trim().toLowerCase() === col),
        ),
      );

      const rows: LocalPreviewRow[] = [];
      if (headerIndex !== -1) {
        const col = (name: string) =>
          rawRows[headerIndex].findIndex(
            (cell) => String(cell ?? '').trim().toLowerCase() === name,
          );
        const idx = {
          dni: col('dni'),
          names: col('names'),
          lastNames: col('lastNames'),
          institutionalEmail: col('institutionalEmail'),
        };
        for (let i = headerIndex + 1; i < rawRows.length && rows.length < 10; i++) {
          const r = rawRows[i];
          if (r.every((cell) => String(cell ?? '').trim() === '')) continue;
          rows.push({
            rowNumber: i + 1,
            dni: String(r[idx.dni] ?? '').trim(),
            names: String(r[idx.names] ?? '').trim(),
            lastNames: String(r[idx.lastNames] ?? '').trim(),
            institutionalEmail: String(r[idx.institutionalEmail] ?? '').trim(),
          });
        }
      }
      this.store.setLocalRows(rows);
    } catch {
      this.store.setLocalRows([]);
    }
  }

  private async loadServerPreview(file: File): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const summary = await lastValueFrom(
        this.importsService.previewParticipants(file, this.store.courseId()),
      );
      this.store.setSummary(summary);
    } catch (error: any) {
      this.store.setSummary(null);
      this.store.setError(error?.error?.message ?? 'Error al previsualizar el archivo');
    } finally {
      this.store.setLoading(false);
    }
  }

  private async loadCourseName(courseId: string): Promise<void> {
    try {
      const course = await lastValueFrom(this.courseService.getCourseById(courseId));
      this.store.setCourse(courseId, course.name ?? '');
    } catch {
      this.store.setCourse(courseId, '');
    }
  }
}