import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TeacherStats, CourseStats } from '@core/services/stats.service';
import { Course } from '@core/models';
import { StudentProfileDialogComponent } from '@features/courses/course-detail/student-profile-dialog.component';

export interface TeacherStatsDialogData {
  teacher: TeacherStats;
  courses: CourseStats[];
}

@Component({
  selector: 'app-teacher-stats-dialog',
  standalone: false,
  templateUrl: './teacher-stats-dialog.component.html',
  styleUrls: ['./teacher-stats-dialog.component.scss']
})
export class TeacherStatsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TeacherStatsDialogData,
    private dialog: MatDialog,
  ) {}

  /**
   * Abre el perfil del docente reusando StudentProfileDialogComponent
   * (R6-4). Mapea TeacherStats → shape de estudiante; funciona para TODOS
   * los roles del admin dashboard (secretaria/soporte incluidos) sin navegar
   * a /users (evita 403). El gating `!isStaff` del dialog oculta el botón de
   * mensaje para staff.
   */
  openProfile(): void {
    const { teacher, courses } = this.data;
    this.dialog.open(StudentProfileDialogComponent, {
      width: '480px',
      maxWidth: '92vw',
      data: {
        student: {
          id: teacher.teacherId,
          name: teacher.name,
          email: teacher.email,
          dni: '',
          career: '',
        },
        courses: courses.map((c) => ({
          _id: c.courseId,
          name: c.name,
          code: c.code,
          career: '',
        } as Course)),
      },
    });
  }
}