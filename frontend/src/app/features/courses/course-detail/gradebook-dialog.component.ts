import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { ForumService } from '@core/services/forum.service';
import { ExamService, Exam } from '@core/services/exam.service';
import { CourseService } from '@core/services/course.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { Task, TaskSubmission } from '@core/models';

export interface GradeVariable {
  key: string;
  label: string;
  weight: number; // porcentaje
  source: 'foro' | 'tarea' | 'examen' | 'manual';
}

// Config por defecto con exámenes (Spec R1): EXA 15% source 'examen',
// rebalanceado a 100%. Aplica solo a configs nuevas o tras "Restablecer";
// los cursos con cfg.variables guardada conservan sus pesos (loadConfig).
const DEFAULT_VARIABLES: GradeVariable[] = [
  { key: 'FOR', label: 'Exposiciones', weight: 15, source: 'foro' },
  { key: 'NC', label: 'Conceptual', weight: 30, source: 'manual' },
  { key: 'TAR', label: 'Trabajos', weight: 30, source: 'tarea' },
  { key: 'ACT', label: 'Actitudinal', weight: 10, source: 'manual' },
  { key: 'EXA', label: 'Exámenes', weight: 15, source: 'examen' },
];

@Component({
  selector: 'app-gradebook-dialog',
  standalone: false,
  templateUrl: './gradebook-dialog.component.html',
  styleUrls: ['./gradebook-dialog.component.scss']
})
export class GradebookDialogComponent implements OnInit {
  tasks: Task[] = [];
  exams: Exam[] = [];
  forums: { _id: string; title: string }[] = [];
  students: { id: string; name: string }[] = [];
  submissionsByTask: Record<string, TaskSubmission[]> = {};
  forumEvaluations: Record<string, Record<string, number>> = {}; // forumId -> userId -> score
  variables: GradeVariable[] = JSON.parse(JSON.stringify(DEFAULT_VARIABLES));
  manualScores: Record<string, number> = {}; // `${studentId}|${key}` -> nota
  examScores: Record<string, number | null> = {}; // `${studentId}|${examId}` -> nota del mejor intento
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { courseId: string },
    private taskService: TaskService,
    private userService: UserService,
    private forumService: ForumService,
    private examService: ExamService,
    private courseService: CourseService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadConfig();
    this.load();
  }

  private loadConfig() {
    // Cargar configuración guardada (variables + notas manuales) del curso
    this.courseService.getCourseById(this.data.courseId).subscribe({
      next: (course: any) => {
        const cfg = course?.gradebookConfig;
        if (cfg?.variables && Array.isArray(cfg.variables) && cfg.variables.length > 0) {
          this.variables = cfg.variables;
        }
        if (cfg?.manualScores) {
          this.manualScores = { ...cfg.manualScores };
        }
      },
      error: () => {},
    });
  }

  saveConfig() {
    this.courseService.updateCourse(this.data.courseId, {
      gradebookConfig: {
        variables: this.variables,
        manualScores: this.manualScores,
      },
    } as any).subscribe({
      next: () => this.notificationService.success('Notas guardadas'),
      error: () => this.notificationService.error('Error al guardar las notas'),
    });
  }

  load() {
    this.isLoading = true;
    this.loadTasks();
    this.loadExams();
    this.loadForums();
  }

  private loadTasks() {
    this.taskService.getTasksByCourse(this.data.courseId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        let pending = tasks.length;
        if (pending === 0) return;
        this.tasks.forEach(task => {
          this.taskService.getSubmissions(task._id).subscribe({
            next: (subs) => {
              this.submissionsByTask[task._id] = subs;
              pending--;
              if (pending === 0) this.maybeFinish();
            },
            error: () => {
              this.submissionsByTask[task._id] = [];
              pending--;
              if (pending === 0) this.maybeFinish();
            },
          });
        });
      },
      error: () => {},
    });
  }

  private loadExams() {
    this.examService.getExamsByCourse(this.data.courseId).subscribe({
      next: (exams) => {
        this.exams = exams;
        this.maybeFinish();
      },
      error: () => {},
    });
  }

  private loadForums() {
    this.forumService.getForumsByCourse(this.data.courseId).subscribe({
      next: (forums) => {
        const evaluated = forums.filter(f => f.isEvaluated);
        this.forums = evaluated.map(f => ({ _id: f._id, title: f.title }));
        let pending = evaluated.length;
        if (pending === 0) {
          this.maybeFinish();
          return;
        }
        evaluated.forEach(forum => {
          this.forumService.getEvaluations(forum._id).subscribe({
            next: (evals) => {
              const byUser: Record<string, number> = {};
              evals.forEach(e => {
                byUser[e.userId?.toString()] = e.score;
              });
              this.forumEvaluations[forum._id] = byUser;
              pending--;
              if (pending === 0) this.maybeFinish();
            },
            error: () => {
              this.forumEvaluations[forum._id] = {};
              pending--;
              if (pending === 0) this.maybeFinish();
            },
          });
        });
      },
      error: () => this.maybeFinish(),
    });
  }

  private loadCounter = 0;
  private expectedLoads = 3;
  private maybeFinish() {
    this.loadCounter++;
    if (this.loadCounter >= this.expectedLoads) {
      this.loadUsers();
    }
  }

  private loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const ids = new Set<string>();
        Object.values(this.submissionsByTask).forEach(subs =>
          subs.forEach(s => ids.add(s.studentId?.toString()))
        );
        Object.values(this.forumEvaluations).forEach(byUser =>
          Object.keys(byUser).forEach(id => ids.add(id))
        );
        this.exams.forEach(exam =>
          (exam.attempts || []).forEach(a => {
            if (a.score !== undefined && a.score !== null) ids.add(a.studentId?.toString());
          })
        );
        this.students = users
          .filter(u => u.role === 'estudiante' && ids.has(u._id))
          .map(u => ({ id: u._id, name: `${u.names} ${u.lastNames}`.trim() }));
        // Inicializa las celdas editables de exámenes con el score del mejor intento
        this.examScores = {};
        this.students.forEach(s => {
          this.exams.forEach(exam => {
            const best = this.bestAttempt(s.id, exam);
            this.examScores[`${s.id}|${exam._id}`] = best ? best.score : null;
          });
        });
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  // ===== Gestión de variables =====

  addVariable() {
    this.variables.push({ key: 'VAR' + (this.variables.length + 1), label: 'Nueva', weight: 0, source: 'tarea' });
  }

  removeVariable(index: number) {
    this.variables.splice(index, 1);
  }

  totalWeight(): number {
    return this.variables.reduce((acc, v) => acc + (v.weight || 0), 0);
  }

  weightWarning(): boolean {
    return this.totalWeight() !== 100;
  }

  // Spec R1: Restablecer vuelve a DEFAULT_VARIABLES (con EXA) Y persiste —
  // limpia las variables guardadas (conserva manualScores) para que el curso
  // vuelva al default con exámenes en el próximo loadConfig.
  resetWeights() {
    this.variables = JSON.parse(JSON.stringify(DEFAULT_VARIABLES));
    this.courseService.updateCourse(this.data.courseId, {
      gradebookConfig: {
        variables: [],
        manualScores: this.manualScores,
      },
    } as any).subscribe({
      next: () => this.notificationService.success('Pesos restablecidos a la configuración por defecto'),
      error: () => this.notificationService.error('Error al restablecer los pesos'),
    });
  }

  // ===== Cálculo de notas =====

  // Nota de un estudiante en una variable (0-20)
  variableScore(studentId: string, variable: GradeVariable): number | null {
    if (variable.source === 'foro') {
      const all: number[] = [];
      Object.values(this.forumEvaluations).forEach(byUser => {
        const s = byUser[studentId];
        if (s !== undefined && s !== null) all.push(s);
      });
      return this.avg(all);
    }

    if (variable.source === 'examen') {
      // Nota de examen = MEJOR intento (max score) por examen; la variable
      // promedia esos mejores intentos (Spec R1: "Mejor intento" usa 16).
      const all: number[] = [];
      this.exams.forEach(exam => {
        const best = this.bestAttempt(studentId, exam);
        if (best?.score !== undefined && best?.score !== null) all.push(best.score);
      });
      return this.avg(all);
    }

    if (variable.source === 'manual') {
      const val = this.manualScores[`${studentId}|${variable.key}`];
      return val !== undefined && val !== null ? val : null;
    }

    // tarea
    const all: number[] = [];
    this.tasks.forEach(task => {
      const subs = this.submissionsByTask[task._id] || [];
      const mine = subs.find(s => s.studentId?.toString() === studentId);
      if (mine && mine.score !== undefined && mine.score !== null) {
        all.push(mine.score);
      }
    });
    return this.avg(all);
  }

  // Nota final ponderada del estudiante (0-20)
  finalScore(studentId: string): number | null {
    let total = 0;
    let hasAny = false;
    this.variables.forEach(v => {
      const s = this.variableScore(studentId, v);
      if (s !== null) {
        total += (s * (v.weight || 0)) / 100;
        hasAny = true;
      }
    });
    return hasAny ? Math.round(total * 100) / 100 : null;
  }

  variableAverage(variable: GradeVariable): string {
    const scores: number[] = [];
    this.students.forEach(s => {
      const val = this.variableScore(s.id, variable);
      if (val !== null) scores.push(val);
    });
    return this.avg(scores)?.toFixed(1) ?? '—';
  }

  // ===== Notas individuales por evaluación =====

  taskScore(studentId: string, taskId: string): number | string {
    const subs = this.submissionsByTask[taskId] || [];
    const mine = subs.find(s => s.studentId?.toString() === studentId);
    if (!mine) return '—';
    if (mine.score === undefined || mine.score === null) return 'Entregó';
    return mine.score;
  }

  taskAverageOf(taskId: string): string {
    const subs = (this.submissionsByTask[taskId] || []).filter(s => s.score !== undefined && s.score !== null);
    if (subs.length === 0) return '—';
    const avg = subs.reduce((acc, s) => acc + (s.score || 0), 0) / subs.length;
    return avg.toFixed(1);
  }

  forumScore(studentId: string, forumId: string): number | string {
    const val = this.forumEvaluations[forumId]?.[studentId];
    return val !== undefined && val !== null ? val : '—';
  }

  forumAverageOf(forumId: string): string {
    const byUser = this.forumEvaluations[forumId] || {};
    const scores = Object.values(byUser).filter(s => s !== undefined && s !== null);
    if (scores.length === 0) return '—';
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }

  examScore(studentId: string, exam: Exam): number | string {
    const attempts = (exam.attempts || []).filter(a => a.studentId?.toString() === studentId);
    if (attempts.length === 0) return '—';
    const best = this.bestAttempt(studentId, exam);
    return best ? best.score : 'Rindió';
  }

  examAverageOf(exam: Exam): string {
    const scored = (exam.attempts || []).filter(a => a.score !== undefined && a.score !== null);
    if (scored.length === 0) return '—';
    const avg = scored.reduce((a, b) => a + (b.score || 0), 0) / scored.length;
    return avg.toFixed(1);
  }

  // ===== Notas de exámenes editables =====

  get canGradeExams(): boolean {
    return this.authService.hasPermission('examenes.calificar');
  }

  // Mejor intento calificado del estudiante (max score; en empate el primero del
  // array). Mismo criterio que examScore() y que setAttemptScore del backend.
  bestAttempt(studentId: string, exam: Exam): any | null {
    const scored = (exam.attempts || []).filter(
      a => a.studentId?.toString() === studentId && a.score !== undefined && a.score !== null
    );
    if (scored.length === 0) return null;
    return scored.reduce((best, a) => ((a.score || 0) > (best.score || 0) ? a : best));
  }

  // Máximo permitido en el input: maxScore del mejor intento ?? Σ questions.points
  // (mismo cálculo que setAttemptScore del backend).
  examMaxFor(studentId: string, exam: Exam): number {
    const best = this.bestAttempt(studentId, exam);
    if (best?.maxScore != null) return best.maxScore;
    return (exam.questions || []).reduce((acc, q) => acc + (q.points || 0), 0);
  }

  // Guarda por celda vía PATCH /exams/:id/attempts/:studentId. El backend edita el
  // MEJOR intento; al responder se actualiza localmente y examScore()/finalScore se
  // recomputan solos (client-side).
  saveExamScore(studentId: string, exam: Exam, event: any) {
    const key = `${studentId}|${exam._id}`;
    const input = event?.target as HTMLInputElement | undefined;
    const previous = this.bestAttempt(studentId, exam)?.score ?? null;
    const raw = input?.value ?? '';
    const value = raw === '' ? null : Number(raw);

    // Vacío, inválido o sin cambios → restaura el valor mostrado y no llama al backend
    if (value === null || Number.isNaN(value) || value === previous) {
      if (input) input.value = previous === null ? '' : String(previous);
      this.examScores[key] = previous;
      return;
    }

    const max = this.examMaxFor(studentId, exam);
    if (value < 0 || value > max) {
      this.notificationService.error(`La nota debe estar entre 0 y ${max}`);
      if (input) input.value = String(previous);
      this.examScores[key] = previous;
      return;
    }

    this.examService.updateAttemptScore(exam._id, studentId, value).subscribe({
      next: () => {
        const best = this.bestAttempt(studentId, exam);
        if (best) {
          best.score = value;
          best.status = 'completed';
        }
        // El input muestra el mejor intento RECALCULADO (si otro intento quedó por
        // encima tras la edición, ese es el que muestra examScore(), igual que un reload)
        this.examScores[key] = this.bestAttempt(studentId, exam)?.score ?? value;
        this.notificationService.success('Nota de examen guardada');
      },
      error: (err) => {
        if (input) input.value = String(previous);
        this.examScores[key] = previous;
        if (err?.status === 403) {
          this.notificationService.error('No tienes permiso para calificar exámenes');
        } else if (err?.status === 400) {
          this.notificationService.error(err?.error?.message || `La nota debe estar entre 0 y ${max}`);
        } else {
          this.notificationService.error('Error al guardar la nota del examen');
        }
      },
    });
  }

  // Promedio de un estudiante en un tipo de evaluación (para la columna final del detalle)
  studentTaskAverage(studentId: string): number | null {
    const all: number[] = [];
    this.tasks.forEach(task => {
      const val = this.taskScore(studentId, task._id);
      if (typeof val === 'number') all.push(val);
    });
    return this.avg(all);
  }

  studentForumAverage(studentId: string): number | null {
    const all: number[] = [];
    this.forums.forEach(f => {
      const val = this.forumScore(studentId, f._id);
      if (typeof val === 'number') all.push(val);
    });
    return this.avg(all);
  }

  studentExamAverage(studentId: string): number | null {
    const all: number[] = [];
    this.exams.forEach(exam => {
      const val = this.examScore(studentId, exam);
      if (typeof val === 'number') all.push(val);
    });
    return this.avg(all);
  }

  // Variable configurada para un tipo de fuente (para saber si mostrar el detalle)
  hasVariableWithSource(source: string): boolean {
    return this.variables.some(v => v.source === source);
  }

  variableForSource(source: string): GradeVariable | undefined {
    return this.variables.find(v => v.source === source);
  }

  hasAnyData(): boolean {
    return this.students.length > 0;
  }

  sourceLabel(source: string): string {
    const labels: Record<string, string> = {
      foro: 'Foros',
      tarea: 'Tareas',
      examen: 'Exámenes',
      manual: 'Manual (docente)',
    };
    return labels[source] || source;
  }

  private avg(list: number[]): number | null {
    if (list.length === 0) return null;
    return list.reduce((a, b) => a + b, 0) / list.length;
  }
}