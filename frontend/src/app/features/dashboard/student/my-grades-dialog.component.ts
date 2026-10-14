import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

/**
 * Mis Notas (Spec: Student Grades — promedio borrador corregido).
 *
 * Reutiliza el componente compartido `StudentGradesComponent` (standalone) con
 * `courseId` indefinido = todos los cursos del estudiante. Conserva el banner
 * Q10 y el cierre del dialog; el promedio (publicadas-preferente, fallback
 * todas, '—' si ninguna) vive ahora en grades.utils via el componente.
 */
@Component({
  selector: 'app-my-grades-dialog',
  standalone: false,
  templateUrl: './my-grades-dialog.component.html',
  styleUrls: ['./my-grades-dialog.component.scss'],
})
export class MyGradesDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<MyGradesDialogComponent>,
    private router: Router,
  ) {}

  close() {
    this.dialogRef.close();
  }

  /** "Ver curso" desde una fila (Spec N8): cierra el diálogo y navega al curso. */
  onCourseSelected(courseId: string): void {
    this.dialogRef.close();
    this.router.navigate(['/courses', courseId]);
  }
}