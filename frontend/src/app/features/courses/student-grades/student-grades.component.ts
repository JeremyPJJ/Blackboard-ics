import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { CourseService } from '@core/services/course.service';
import { TaskService } from '@core/services/task.service';
import { ExamService } from '@core/services/exam.service';
import { ForumService } from '@core/services/forum.service';
import { calculateAverage } from './grades.utils';

export interface GradeRow {
  /** Curso de origen (course._id); ausente → la fila no muestra "Ver curso" (Spec N8). */
  courseId?: string;
  courseName?: string;
  kind: 'tarea' | 'examen' | 'foro';
  title: string;
  score: number | null;
  isPublished: boolean;
  status: string;
}

/**
 * Notas del estudiante (Spec: Student Grades).
 *
 * Componente standalone compartido que muestra las calificaciones del
 * estudiante actual por curso: tareas (tasks/course + submissions), exámenes
 * (exams/course + attempts, mejor intento) y foros evaluados (evaluations
 * filtradas SIEMPRE a su propio userId — privacidad). El promedio usa
 * grades.utils.calculateAverage (publicadas-preferente, fallback todas).
 *
 * @Input courseId: curso puntual. Si se omite, carga TODOS los cursos del
 * estudiante (modo dialog "Mis Notas" del dashboard).
 */
@Component({
  selector: 'app-student-grades',
  standalone: true,
  templateUrl: './student-grades.component.html',
  styleUrls: ['./student-grades.component.scss'],
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
})
export class StudentGradesComponent implements OnInit {
  /** Curso puntual; si no se pasa, se cargan todos los cursos del estudiante. */
  @Input() courseId?: string;

  /** Pide al host cerrar el diálogo y navegar al curso (Spec N8 — patrón goToCourse). */
  @Output() courseSelected = new EventEmitter<string>();

  rows: GradeRow[] = [];
  isLoading = true;
  showCourseColumn = false;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private taskService: TaskService,
    private examService: ExamService,
    private forumService: ForumService,
  ) {}

  ngOnInit() {
    this.load();
  }

  get average(): number | '—' {
    return calculateAverage(
      this.rows.map(r => ({ score: r.score, isPublished: r.isPublished })),
    );
  }

  get averageLabel(): string {
    return this.average === '—' ? '—' : this.average.toFixed(1);
  }

  private load() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.isLoading = false;
      return;
    }

    if (this.courseId) {
      this.showCourseColumn = false;
      this.loadCourse({ _id: this.courseId, name: '' }, user._id);
      return;
    }

    this.showCourseColumn = true;
    this.courseService.getCourses({ studentId: user._id }).subscribe({
      next: (courses) => {
        if (courses.length === 0) {
          this.isLoading = false;
          return;
        }
        forkJoin(courses.map(c => this.loadCourse$(c, user._id))).subscribe({
          next: (rowsPerCourse) => {
            this.rows = rowsPerCourse.flat();
            this.isLoading = false;
          },
          error: () => (this.isLoading = false),
        });
      },
      error: () => (this.isLoading = false),
    });
  }

  private loadCourse(course: { _id: string; name: string }, userId: string) {
    this.loadCourse$(course, userId).subscribe({
      next: (rows) => {
        this.rows = rows;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  private loadCourse$(course: { _id: string; name: string }, userId: string) {
    return forkJoin({
      tasks: this.taskService.getTasksByCourse(course._id),
      exams: this.examService.getExamsByCourse(course._id),
      forums: this.forumService.getForumsByCourse(course._id),
    }).pipe(
      switchMap(({ tasks, exams, forums }) => {
        const taskRows$ = tasks.map(task =>
          this.taskService.getSubmissions(task._id).pipe(
            map(subs => this.taskRows(task, subs, userId, course)),
          ),
        );
        const forumRows$ = forums
          .filter(f => f.isEvaluated)
          .map(forum =>
            this.forumService.getEvaluations(forum._id).pipe(
              map(evals => this.forumRows(forum, evals, userId, course)),
            ),
          );
        const examRows = exams
          .map(exam => this.examRow(exam, userId, course))
          .filter((r): r is GradeRow => r !== null);

        const inner$ = [...taskRows$, ...forumRows$];
        return (inner$.length ? forkJoin(inner$) : of([])).pipe(
          map(nested => nested.flat().concat(examRows)),
        );
      }),
    );
  }

  private taskRows(task: any, subs: any[], userId: string, course: { _id: string; name: string }): GradeRow[] {
    const mine = subs.find((s: any) => s.studentId?.toString() === userId);
    return [{
      courseId: course._id,
      courseName: course.name,
      kind: 'tarea',
      title: task.title,
      score: mine?.score ?? null,
      isPublished: !!mine?.isPublished,
      status: !mine ? 'Sin entrega' : mine.isPublished ? 'Publicada' : 'Borrador',
    }];
  }

  private examRow(exam: any, userId: string, course: { _id: string; name: string }): GradeRow | null {
    const attempts = (exam.attempts || []).filter(
      (a: any) => a.studentId?.toString() === userId,
    );
    const scored = attempts.filter(
      (a: any) => a.score !== undefined && a.score !== null,
    );
    if (scored.length === 0) {
      return {
        courseId: course._id,
        courseName: course.name,
        kind: 'examen',
        title: exam.title,
        score: null,
        isPublished: false,
        status: attempts.length > 0 ? 'Rindió' : 'Sin rendir',
      };
    }
    const best = Math.max(...scored.map((a: any) => a.score));
    return {
      courseId: course._id,
      courseName: course.name,
      kind: 'examen',
      title: exam.title,
      score: best,
      isPublished: true,
      status: 'Calificado',
    };
  }

  private forumRows(forum: any, evals: any[], userId: string, course: { _id: string; name: string }): GradeRow[] {
    // Privacidad: SIEMPRE se filtra a la evaluación del propio usuario.
    const mine = evals.find((e: any) => e.userId?.toString() === userId);
    const hasScore = mine?.score !== undefined && mine?.score !== null;
    return [{
      courseId: course._id,
      courseName: course.name,
      kind: 'foro',
      title: forum.title,
      score: hasScore ? mine.score : null,
      isPublished: hasScore,
      status: hasScore ? 'Calificado' : 'Sin evaluar',
    }];
  }

  /** Solicita al host cerrar el diálogo y navegar a /courses/:id (Spec N8). */
  goToCourse(courseId: string): void {
    this.courseSelected.emit(courseId);
  }
}