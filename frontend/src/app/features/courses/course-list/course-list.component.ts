import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { Course, CourseStatus } from '@core/models';

@Component({
  selector: 'app-course-list',
  standalone: false,
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  isLoading = true;
  selectedCareer = '';
  selectedStatus = '';
  searchTerm = '';
  selectedYear = '';
  selectedSemester = '';
  years: number[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByCourseId(index: number, course: Course): string {
    return course._id;
  }

  get isTeacherOrAdmin(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return role !== 'estudiante';
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  romanCycle(n: number | undefined): string {
    const map: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
    return n ? (map[n] || String(n)) : '—';
  }

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
    this.loadCourses();
    this.loadTeacherNames();
  }

  getTeacherName(course: Course): string {
    const seen = new Set<string>();
    const names = (course.teachers || [])
      .map(t => {
        const key = t.userId?.toString();
        if (!key || seen.has(key)) return null;
        seen.add(key);
        return this.teacherNameMap.get(key);
      })
      .filter((n): n is string => !!n);
    return names.length > 0 ? names.join(', ') : 'Sin asignar';
  }

  private teacherNameMap = new Map<string, string>();

  private loadTeacherNames() {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.teacherNameMap = new Map(
            users.map(u => [u._id, `${u.names} ${u.lastNames}`.trim()])
          );
        },
        error: () => {},
      });
  }

  loadCourses() {
    this.isLoading = true;
    
    const filters: any = {};
    if (this.selectedCareer) filters.career = this.selectedCareer;
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.selectedYear) filters.year = this.selectedYear;
    if (this.selectedSemester) filters.semester = this.selectedSemester;

    this.courseService.getCourses(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.notificationService.error('Error al cargar los cursos');
          this.isLoading = false;
        },
      });
  }

  deleteCourse(courseId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Archivar Curso',
        message: '¿Está seguro de archivar este curso? Los estudiantes inscritos serán notificados.',
        confirmText: 'Archivar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.courseService.deleteCourse(courseId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.courses = this.courses.filter(c => c._id !== courseId);
              this.notificationService.success('Curso archivado exitosamente');
            },
            error: (error) => {
              console.error('Error deleting course:', error);
              const msg = error.error?.message || 'Error al archivar el curso';
              this.notificationService.error(msg, 'Reintentar', () => this.deleteCourse(courseId));
            },
          });
      }
    });
  }

  restoreCourse(courseId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Restaurar Curso',
        message: '¿Está seguro de restaurar este curso?',
        confirmText: 'Restaurar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.courseService.restoreCourse(courseId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Curso restaurado exitosamente');
              this.loadCourses();
            },
            error: (error) => {
              console.error('Error restoring course:', error);
              this.notificationService.error(error.error?.message || 'Error al restaurar el curso');
            },
          });
      }
    });
  }

  deleteCoursePermanent(courseId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Curso Definitivamente',
        message: '¿Está seguro? Esta acción NO se puede deshacer. Se eliminará el curso y todo su contenido.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.courseService.deleteCoursePermanent(courseId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.courses = this.courses.filter(c => c._id !== courseId);
              this.notificationService.success('Curso eliminado definitivamente');
            },
            error: (error) => {
              console.error('Error deleting course permanently:', error);
              this.notificationService.error(error.error?.message || 'Error al eliminar el curso');
            },
          });
      }
    });
  }
}
