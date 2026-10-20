import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { TaskService } from '@core/services/task.service';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { Course } from '@core/models';
import { MessagingStore } from '@features/messaging/store/messaging.store';
import { StudentProfileDialogComponent } from './student-profile-dialog.component';
import { MaterialEditDialogComponent, MaterialEditResult } from './material-edit-dialog.component';
import { MaterialCreateDialogComponent, MaterialCreateResult } from './material-create-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { FilePreviewDialogComponent } from '@shared/components/file-preview-dialog.component';
import { LinkPreviewDialogComponent } from '@shared/components/link-preview-dialog.component';
import { TaskCreateDialogComponent } from '@features/tasks/task-create-dialog/task-create-dialog.component';
import { ForumService } from '@core/services/forum.service';
import { CreateForumDialogComponent } from '@features/forums/forums/create-forum-dialog.component';
import { GradebookDialogComponent } from './gradebook-dialog.component';
import { ExamService, Exam } from '@core/services/exam.service';
import { ExamCreateDialogComponent } from '@features/exams/exam-create-dialog.component';
import { ExamTakingDialogComponent } from '@features/exams/exam-taking-dialog.component';
import { ExamSupervisionDialogComponent } from '@features/exams/exam-supervision-dialog.component';

interface Participant {
  id: string;
  name: string;
  email: string;
  dni: string;
  photo?: string;
  role: string;
  career?: string;
  status?: string;
  addedBy?: string;
  enrolledAt?: Date;
}

@Component({
  selector: 'app-course-detail',
  standalone: false,
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  isLoading = true;
  courseId: string;
  teachers: Participant[] = [];
  students: Participant[] = [];

  // Alta de estudiante por DNI/correo
  addStudentInput = '';
  searchingStudent = false;
  studentResults: any[] = [];
  addingUserId: string | null = null;

  // Materiales por sesión
  materialWeek = 0;
  materialSession = 0;
  materialType = 'pdf';
  materialTitle = '';
  materialDescription = '';
  materialUrl = '';
  materialFile: File | null = null;
  addingMaterial = false;
  sessionTime = '08:00';

  // Tareas del curso agrupadas por semana/sesión
  courseTasks: any[] = [];
  courseForums: any[] = [];
  courseExams: Exam[] = [];

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private userService: UserService,
    private authService: AuthService,
    private taskService: TaskService,
    private forumService: ForumService,
    private examService: ExamService,
    public fileService: FileService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
    private messagingStore: MessagingStore,
  ) {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.loadCourse();
    this.loadCourseTasks();
    this.loadForums();
    this.loadExams();
  }

  ngOnDestroy() {
    this.stopSessionCountdowns();
  }

  loadExams() {
    this.examService.getExamsByCourse(this.courseId).subscribe({
      next: (exams) => { this.courseExams = exams; },
      error: () => {},
    });
  }

  getWeekExams(weekNum: number): Exam[] {
    return this.courseExams.filter(e => Number(e.weekNumber) === Number(weekNum));
  }

  openExamCreate(weekNum: number) {
    const dialogRef = this.dialog.open(ExamCreateDialogComponent, {
      width: '680px',
      maxWidth: '94vw',
      data: { courseId: this.courseId, weekNumber: weekNum },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadExams();
        this.notificationService.success('Examen creado');
      }
    });
  }

  openExamEdit(exam: Exam) {
    const dialogRef = this.dialog.open(ExamCreateDialogComponent, {
      width: '680px',
      maxWidth: '94vw',
      data: { courseId: this.courseId, weekNumber: exam.weekNumber, exam },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadExams();
        this.notificationService.success('Examen actualizado');
      }
    });
  }

  openExamTake(exam: Exam) {
    const dialogRef = this.dialog.open(ExamTakingDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      disableClose: true,
      data: { exam },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.timedOut) {
        this.notificationService.warning('El tiempo del examen terminó. Se envió automáticamente.');
      } else if (result?.submitted) {
        this.notificationService.success('Examen entregado');
      }
      this.loadExams();
    });
  }

  openExamSupervision(exam: Exam) {
    this.dialog.open(ExamSupervisionDialogComponent, {
      width: '680px',
      maxWidth: '94vw',
      data: { examId: exam._id, title: exam.title },
    });
  }

  deleteExam(exam: Exam) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Examen',
        message: `¿Está seguro de eliminar el examen "${exam.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.examService.deleteExam(exam._id).subscribe({
        next: () => {
          this.loadExams();
          this.notificationService.success('Examen eliminado');
        },
        error: (error) => this.notificationService.error(error.error?.message || 'Error al eliminar el examen'),
      });
    });
  }

  deleteForum(forumId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Foro',
        message: '¿Está seguro de eliminar este foro y todas sus publicaciones?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.forumService.deleteForum(forumId).subscribe({
        next: () => {
          this.loadForums();
          this.notificationService.success('Foro eliminado');
        },
        error: (error) => this.notificationService.error(error.error?.message || 'Error al eliminar el foro'),
      });
    });
  }

  deleteTask(taskId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Tarea',
        message: '¿Está seguro de eliminar esta tarea y todas sus entregas?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadCourseTasks();
          this.notificationService.success('Tarea eliminada');
        },
        error: (error) => this.notificationService.error(error.error?.message || 'Error al eliminar la tarea'),
      });
    });
  }

  myExamAttempt(exam: Exam): any | null {
    const me = this.authService.getCurrentUser();
    if (!me) return null;
    const attempts = (exam.attempts || []).filter(a => a.studentId?.toString() === me._id);
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  }

  loadForums() {
    this.forumService.getForumsByCourse(this.courseId).subscribe({
      next: (forums) => { this.courseForums = forums; },
      error: () => {},
    });
  }

  getWeekForums(weekNum: number): any[] {
    return this.courseForums.filter(f => Number(f.weekNumber) === Number(weekNum));
  }

  openForumCreate(weekNum: number) {
    const dialogRef = this.dialog.open(CreateForumDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data: { courseId: this.courseId, weekNumber: weekNum },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadForums();
        this.notificationService.success('Foro creado');
      }
    });
  }

  openGradebook() {
    this.dialog.open(GradebookDialogComponent, {
      width: '780px',
      maxWidth: '94vw',
      data: { courseId: this.courseId },
    });
  }

  loadCourseTasks() {
    this.taskService.getTasksByCourse(this.courseId).subscribe({
      next: (tasks) => {
        this.courseTasks = tasks;
      },
      error: () => {},
    });
  }

  getSessionTasks(weekNum: number, sessionNum: number): any[] {
    return this.courseTasks.filter(
      t => Number(t.weekNumber) === Number(weekNum) && Number(t.sessionNumber) === Number(sessionNum)
    );
  }

  getWeekTasks(weekNum: number): any[] {
    return this.courseTasks.filter(t => Number(t.weekNumber) === Number(weekNum));
  }

  setMaterialWeek(wi: number) {
    this.materialWeek = wi;
    this.materialSession = 0;
    this.scrollToMaterialForm();
  }

  loadCourse() {
    this.isLoading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.resolveParticipants();
        this.startSessionCountdowns();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.isLoading = false;
      },
    });
  }

  searchStudent() {
    const query = (this.addStudentInput || '').trim();
    if (!query) return;

    this.searchingStudent = true;
    this.studentResults = [];

    // Buscar por DNI o correo (el search del backend cubre dni, names, email)
    this.userService.getUsers({ search: query }).subscribe({
      next: (users) => {
        this.studentResults = users.filter(u => u.role === 'estudiante');
        this.searchingStudent = false;
      },
      error: (error) => {
        console.error('Error searching students:', error);
        this.notificationService.error('Error al buscar el estudiante');
        this.searchingStudent = false;
      },
    });
  }

  // Búsqueda en tiempo real con debounce
  private studentSearchTimer: any = null;
  onStudentSearchInput() {
    if (this.studentSearchTimer) {
      clearTimeout(this.studentSearchTimer);
    }
    const query = (this.addStudentInput || '').trim();
    if (!query) {
      this.studentResults = [];
      return;
    }
    this.studentSearchTimer = setTimeout(() => this.searchStudent(), 350);
  }

  addStudent(userId: string) {
    if (!this.course) return;

    this.addingUserId = userId;
    this.courseService.addParticipant(this.courseId, userId, 'student').subscribe({
      next: (course) => {
        this.course = course;
        this.resolveParticipants();
        this.notificationService.success('Estudiante agregado al curso');
        this.addStudentInput = '';
        this.studentResults = [];
        this.addingUserId = null;
      },
      error: (error) => {
        console.error('Error adding student:', error);
        this.notificationService.error(error.error?.message || 'Error al agregar el estudiante');
        this.addingUserId = null;
      },
    });
  }

  isStudentEnrolled(userId: string): boolean {
    return this.students.some(s => s.id === userId);
  }

  copyInviteCode() {
    const code = this.course?.invitationConfig?.code;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      this.notificationService.success('Código copiado: ' + code);
    }).catch(() => {
      this.notificationService.info('Código: ' + code);
    });
  }

  get isTeacherOrAdmin(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return role !== 'estudiante';
  }

  /** Roles staff no pueden crear conversaciones (alcance del backend → ocultar botón). */
  get isStaff(): boolean {
    return this.authService.isStaffRole();
  }

  /** Abre (o crea) la conversación individual con el participante y navega a /messaging. */
  async sendMessageTo(userId: string) {
    try {
      await this.messagingStore.findOrCreateConversation(userId, this.courseId);
      this.router.navigate(['/messaging']);
    } catch {
      // 403/error ya notificado por el store — no navegar (Spec R4)
    }
  }

  isCourseAuthor(teacherId: string): boolean {
    return this.course?.createdBy?.toString() === teacherId;
  }

  teacherStatusClass(status: string | undefined): string {
    switch (status) {
      case 'activo': return 'badge-success';
      case 'inactivo': return 'badge-warning';
      default: return '';
    }
  }

  teacherStatusLabel(status: string | undefined): string {
    return status || 'desconocido';
  }

  wasAddedByAdmin(teacher: Participant): boolean {
    return !!teacher.addedBy && !this.isCourseAuthor(teacher.id);
  }

  onMaterialFileSelected(event: any) {
    const file = event.target.files?.[0];
    this.materialFile = file || null;
  }

  addMaterial() {
    if (!this.course || this.addingMaterial) return;

    const title = (this.materialTitle || '').trim();
    if (!title) {
      this.notificationService.warning('Ingresa un título para el material');
      return;
    }

    this.addingMaterial = true;

    const finish = (fileId?: string) => {
      const weeks = JSON.parse(JSON.stringify(this.course!.weeks || []));
      const weekIdx = Number(this.materialWeek);

      // Rellenar semanas intermedias (evita arrays con huecos/null)
      while (weeks.length <= weekIdx) {
        weeks.push({ number: weeks.length + 1, title: `Semana ${weeks.length + 1}`, materials: [], sessions: [] });
      }
      if (!weeks[weekIdx].materials) {
        weeks[weekIdx].materials = [];
      }

      weeks[weekIdx].materials.push({
        type: this.materialType,
        title: title,
        description: this.materialDescription || '',
        fileId: fileId,
        url: this.materialUrl || undefined,
      });

      this.courseService.updateCourse(this.courseId, { weeks }).subscribe({
        next: (course) => {
          this.course = course;
          this.addingMaterial = false;
          this.materialTitle = '';
          this.materialDescription = '';
          this.materialUrl = '';
          this.materialFile = null;
          this.notificationService.success('Material agregado a la sesión');
        },
        error: (error) => {
          console.error('Error adding material:', error);
          this.notificationService.error('Error al agregar el material');
          this.addingMaterial = false;
        },
      });
    };

    if (this.materialFile) {
      this.fileService.upload(this.materialFile, 'course_material', this.courseId).subscribe({
        next: (uploaded) => finish(uploaded._id),
        error: (error) => {
          console.error('Error uploading material:', error);
          this.notificationService.error('Error al subir el archivo');
          this.addingMaterial = false;
        },
      });
    } else {
      finish();
    }
  }

  getMaterialIcon(type: string): string {
    switch (type) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc': return 'description';
      case 'link': return 'link';
      case 'video': return 'play_circle';
      case 'foto': return 'image';
      default: return 'article';
    }
  }

  getMaterialTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      pdf: 'PDF', doc: 'Documento', link: 'Enlace', video: 'Video', foto: 'Imagen', texto: 'Texto',
    };
    return labels[type] || type;
  }

  downloadResource(mat: any): void {
    if (mat.fileId) {
      const ext = mat.type === 'pdf' ? '.pdf' : mat.type === 'foto' ? '.jpg' : '';
      this.fileService.download(mat.fileId, `${mat.title || 'recurso'}${ext}`);
    }
  }

  previewResource(mat: any): void {
    if (mat.fileId) {
      this.dialog.open(FilePreviewDialogComponent, {
        width: 'calc(100vw - 32px)',
        height: 'calc(100dvh - 32px)',
        maxWidth: '96vw',
        maxHeight: '94dvh',
        data: { fileId: mat.fileId, title: mat.title || 'Archivo', fileType: mat.type },
      });
    }
  }

  openLink(url: string, title: string): void {
    this.dialog.open(LinkPreviewDialogComponent, {
      width: '760px',
      maxWidth: '94vw',
      data: { url, title: title || 'Enlace' },
    });
  }

  editMaterial(weekIdx: number, matIdx: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    const material = weeks[weekIdx]?.materials?.[matIdx];
    if (!material) return;

    const dialogRef = this.dialog.open(MaterialEditDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      data: { title: material.title, description: material.description || '', type: material.type, url: material.url },
    });

    dialogRef.afterClosed().subscribe((result: MaterialEditResult | undefined) => {
      if (!result) return;
      let handled = false;
      const previousFileId = material.fileId;
      const apply = (fileId?: string) => {
        if (handled) return;
        handled = true;
        material.title = result.title;
        material.description = result.description;
        material.type = result.type;
        material.url = result.url;
        if (fileId) material.fileId = fileId;
        this.saveWeeks(weeks, 'Material actualizado', () => this.removeReplacedFile(previousFileId, fileId));
      };
      if (result.file) {
        this.fileService.upload(result.file, 'course_material', this.courseId).subscribe({
          next: (uploaded) => apply(uploaded._id),
          error: (error) => this.notificationService.error(error.error?.message || 'Error al subir el archivo'),
        });
      } else {
        apply();
      }
    });
  }

  editSessionMaterial(wi: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    const material = weeks[wi]?.sessions?.[0]?.materials?.[0];
    if (!material) return;

    const dialogRef = this.dialog.open(MaterialEditDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      data: { title: material.title, description: material.description || '', type: material.type, url: material.url },
    });

    dialogRef.afterClosed().subscribe((result: MaterialEditResult | undefined) => {
      if (!result) return;
      if (result.type !== 'pdf' && result.type !== 'doc') {
        this.notificationService.warning('La sesión solo acepta PDF o Documento');
        return;
      }
      let handled = false;
      const previousFileId = material.fileId;
      const apply = (fileId?: string) => {
        if (handled) return;
        handled = true;
        material.title = result.title;
        material.description = result.description;
        material.type = result.type;
        material.url = result.url;
        if (fileId) material.fileId = fileId;
        this.saveWeeks(weeks, 'Sesión actualizada', () => this.removeReplacedFile(previousFileId, fileId));
      };
      if (result.file) {
        this.fileService.upload(result.file, 'course_material', this.courseId).subscribe({
          next: (uploaded) => apply(uploaded._id),
          error: (error) => this.notificationService.error(error.error?.message || 'Error al subir el archivo'),
        });
      } else {
        apply();
      }
    });
  }

  deleteMaterial(weekIdx: number, matIdx: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    const materials = weeks[weekIdx]?.materials;
    if (!materials || !materials[matIdx]) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Eliminar Material', message: '¿Está seguro de eliminar este material?', confirmText: 'Eliminar', cancelText: 'Cancelar' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      materials.splice(matIdx, 1);
      this.saveWeeks(weeks, 'Material eliminado');
    });
  }

  deleteSession(weekIdx: number, sessionIdx: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    const sessions = weeks[weekIdx]?.sessions;
    if (!sessions || !sessions[sessionIdx]) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Eliminar Sesión', message: '¿Está seguro de eliminar esta sesión y todos sus materiales?', confirmText: 'Eliminar', cancelText: 'Cancelar' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      sessions.splice(sessionIdx, 1);
      this.saveWeeks(weeks, 'Sesión eliminada');
    });
  }

  editWeek(weekIdx: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    const week = weeks[weekIdx];
    if (!week) return;

    const dialogRef = this.dialog.open(MaterialEditDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      data: { title: week.title, description: week.description || '' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      week.title = result.title;
      week.description = result.description;
      this.saveWeeks(weeks, 'Semana actualizada');
    });
  }

  deleteWeek(weekIdx: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    if (!weeks[weekIdx]) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Eliminar Semana', message: '¿Está seguro de eliminar esta semana y todas sus sesiones?', confirmText: 'Eliminar', cancelText: 'Cancelar' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      weeks.splice(weekIdx, 1);
      this.saveWeeks(weeks, 'Semana eliminada');
    });
  }

  createWeek() {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    weeks.push({
      number: weeks.length + 1,
      title: `Semana ${weeks.length + 1}`,
      materials: [],
      sessions: [],
      createdAt: new Date(),
    });
    this.saveWeeks(weeks, 'Semana creada');
  }

  createFirstSession() {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));

    // Asegurar semana 1 con sesión 1
    if (weeks.length === 0) {
      weeks.push({ number: 1, title: 'Semana 1', sessions: [{ number: 1, title: 'Sesión 1', materials: [] }] });
    } else {
      if (!weeks[0].sessions) weeks[0].sessions = [];
      if (weeks[0].sessions.length === 0) {
        weeks[0].sessions.push({ number: 1, title: 'Sesión 1', materials: [] });
      }
    }

    this.saveWeeks(weeks, 'Sesión creada');
    this.materialWeek = 0;
    this.materialSession = 0;
    this.scrollToMaterialForm();
  }

  scrollToMaterialForm() {
    setTimeout(() => {
      const el = document.getElementById('add-material-box');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
  }

  createSession(weekIdx: number) {
    if (!this.course) return;
    const weeks = JSON.parse(JSON.stringify(this.course.weeks || []));
    if (!weeks[weekIdx]) return;
    if (!weeks[weekIdx].sessions) weeks[weekIdx].sessions = [];
    weeks[weekIdx].sessions.push({
      number: weeks[weekIdx].sessions.length + 1,
      title: `Sesión ${weeks[weekIdx].sessions.length + 1}`,
      scheduledDate: new Date(),
      materials: [],
    });
    this.saveWeeks(weeks, 'Sesión registrada');
  }

  getWeekSessionDate(wi: number): string {
    const week = this.course?.weeks?.[wi];
    const session = week?.sessions?.[0];
    if (!session?.scheduledDate) return '';
    return new Date(session.scheduledDate).toLocaleString('es-PE', {
      dateStyle: 'short', timeStyle: 'short',
    });
  }

  // Cuenta regresiva para la sesión programada
  private countdownTimer: any = null;
  sessionCountdowns: Record<number, string> = {};

  startSessionCountdowns() {
    this.stopSessionCountdowns();
    this.updateSessionCountdowns();
    this.countdownTimer = setInterval(() => this.updateSessionCountdowns(), 30000);
  }

  stopSessionCountdowns() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private updateSessionCountdowns() {
    if (!this.course?.weeks) return;
    this.course.weeks.forEach((week, wi) => {
      const session = week?.sessions?.[0];
      if (!session?.scheduledDate) {
        this.sessionCountdowns[wi] = '';
        return;
      }
      const target = new Date(session.scheduledDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        this.sessionCountdowns[wi] = 'Sesión iniciada';
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);

      if (days > 0) {
        this.sessionCountdowns[wi] = `Faltan ${days}d ${hours}h`;
      } else if (hours > 0) {
        this.sessionCountdowns[wi] = `Faltan ${hours}h ${mins}m`;
      } else {
        this.sessionCountdowns[wi] = `Faltan ${mins} min`;
      }
    });
  }

  openMaterialCreate(weekIdx: number) {
    const dialogRef = this.dialog.open(MaterialCreateDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
    });

    dialogRef.afterClosed().subscribe((result: MaterialCreateResult | undefined) => {
      if (!result) return;
      this.addMaterialToWeek(weekIdx, result);
    });
  }

  private addMaterialToWeek(weekIdx: number, result: MaterialCreateResult) {
    if (!this.course) return;

    const finish = (fileId?: string) => {
      const weeks = JSON.parse(JSON.stringify(this.course!.weeks || []));
      while (weeks.length <= weekIdx) {
        weeks.push({ number: weeks.length + 1, title: `Semana ${weeks.length + 1}`, materials: [], sessions: [] });
      }
      if (!weeks[weekIdx].materials) weeks[weekIdx].materials = [];

      weeks[weekIdx].materials.push({
        type: result.type,
        title: result.title,
        description: result.description || '',
        fileId: fileId,
        url: result.url,
      });

      this.courseService.updateCourse(this.courseId, { weeks }).subscribe({
        next: (course) => {
          this.course = course;
          this.notificationService.success('Material agregado');
        },
        error: (error) => {
          console.error('Error adding material:', error);
          this.notificationService.error(error.error?.message || 'Error al agregar el material');
        },
      });
    };

    if (result.file) {
      this.fileService.upload(result.file, 'course_material', this.courseId).subscribe({
        next: (uploaded) => finish(uploaded._id),
        error: (error) => {
          console.error('Error uploading material:', error);
          this.notificationService.error('Error al subir el archivo');
        },
      });
    } else {
      finish();
    }
  }

  openTaskCreate(wi?: number) {
    const dialogRef = this.dialog.open(TaskCreateDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { courseId: this.courseId, weekNumber: wi !== undefined ? this.course?.weeks?.[wi]?.number : undefined },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCourseTasks();
      }
    });
  }

  romanCycle(n: number | undefined): string {
    const map: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
    return n ? (map[n] || String(n)) : '—';
  }

  openSessionCreate(wi: number) {
    const dialogRef = this.dialog.open(MaterialCreateDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      data: { mode: 'session' },
    });

    dialogRef.afterClosed().subscribe((result: MaterialCreateResult | undefined) => {
      if (!result) return;
      if (result.type !== 'pdf' && result.type !== 'doc') {
        this.notificationService.warning('La sesión solo acepta PDF o Documento');
        return;
      }
      this.addSessionMaterial(wi, result);
    });
  }

  private addSessionMaterial(wi: number, result: MaterialCreateResult) {
    if (!this.course) return;

    const finish = (fileId?: string) => {
      const weeks = JSON.parse(JSON.stringify(this.course!.weeks || []));
      if (!weeks[wi]) return;
      if (!weeks[wi].sessions) weeks[wi].sessions = [];

      // Combinar fecha programada + hora (si se eligió)
      let scheduledDate = result.scheduledDate || new Date();
      if (this.sessionTime) {
        const [h, m] = this.sessionTime.split(':').map(Number);
        const d = new Date(scheduledDate);
        d.setHours(h || 0, m || 0, 0, 0);
        scheduledDate = d;
      }

      weeks[wi].sessions[0] = {
        number: 1,
        title: 'Sesión',
        scheduledDate,
        materials: [{
          type: result.type,
          title: result.title,
          description: result.description || '',
          fileId: fileId,
          url: result.url,
        }],
      };

      this.courseService.updateCourse(this.courseId, { weeks }).subscribe({
        next: (course) => {
          this.course = course;
          this.startSessionCountdowns();
          this.notificationService.success('Sesión registrada');
        },
        error: (error) => {
          console.error('Error adding session:', error);
          this.notificationService.error(error.error?.message || 'Error al registrar la sesión');
        },
      });
    };

    if (result.file) {
      this.fileService.upload(result.file, 'course_material', this.courseId).subscribe({
        next: (uploaded) => finish(uploaded._id),
        error: (error) => {
          console.error('Error uploading session file:', error);
          this.notificationService.error('Error al subir el archivo');
        },
      });
    } else {
      finish();
    }
  }

  getWeekSessionMaterial(wi: number): any | null {
    const session = this.course?.weeks?.[wi]?.sessions?.[0];
    return session?.materials?.[0] || null;
  }

  private saveWeeks(weeks: any[], successMsg: string, onSaved?: () => void) {
    this.courseService.updateCourse(this.courseId, { weeks }).subscribe({
      next: (course) => {
        this.course = course;
        this.startSessionCountdowns();
        this.notificationService.success(successMsg);
        onSaved?.();
      },
      error: (error) => {
        console.error('Error saving weeks:', error);
        this.notificationService.error(error.error?.message || 'Error al guardar los cambios');
      },
    });
  }

  private removeReplacedFile(previousFileId?: string, newFileId?: string): void {
    if (!previousFileId || !newFileId || previousFileId === newFileId) return;
    const weeks = this.course?.weeks || [];
    const stillUsed = weeks.some(week => {
      const materials = [
        ...(week.materials || []),
        ...(week.sessions || []).flatMap(session => session.materials || []),
      ];
      return materials.some(material => material.fileId === previousFileId);
    });
    if (stillUsed) return;
    this.fileService.remove(previousFileId).subscribe({
      error: () => console.warn('No se pudo eliminar el archivo anterior:', previousFileId),
    });
  }

  openStudentProfile(student: Participant): void {
    // Cursos donde está inscrito el estudiante
    const studentCourses = this.course
      ? this.course.students.filter(s => s.userId?.toString() === student.id).length > 0
        ? [this.course]
        : []
      : [];

    this.dialog.open(StudentProfileDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      data: {
        student: student,
        courses: studentCourses,
        courseId: this.courseId,
      },
    });
  }

  private resolveParticipants() {
    if (!this.course) return;

    const teacherIds = this.course.teachers.map(t => t.userId);
    const studentIds = this.course.students.map(s => s.userId);

    this.userService.getUsers().subscribe({
      next: (users) => {
        const teacherEnroll = new Map(
          this.course!.teachers.map((t: any) => [t.userId?.toString(), t.enrolledAt])
        );
        const teacherEnrollAdded = new Map(
          this.course!.teachers.map((t: any) => [t.userId?.toString(), t.addedBy?.toString()])
        );
        const studentEnroll = new Map(
          this.course!.students.map((s: any) => [s.userId?.toString(), s.enrolledAt])
        );

        this.teachers = users
          .filter(u => teacherIds.includes(u._id))
          .map(u => ({
            id: u._id,
            name: `${u.names} ${u.lastNames}`.trim(),
            email: u.institutionalEmail,
            dni: u.dni,
            photo: u.photo,
            role: 'docente',
            status: u.status,
            addedBy: teacherEnrollAdded.get(u._id),
            enrolledAt: teacherEnroll.get(u._id),
          }));

        this.students = users
          .filter(u => studentIds.includes(u._id))
          .map(u => ({
            id: u._id,
            name: `${u.names} ${u.lastNames}`.trim(),
            email: u.institutionalEmail,
            dni: u.dni,
            photo: u.photo,
            role: 'estudiante',
            career: u.tags?.[0] || '',
            enrolledAt: studentEnroll.get(u._id),
          }));
      },
      error: (error) => {
        console.error('Error loading participants:', error);
      },
    });
  }
}
