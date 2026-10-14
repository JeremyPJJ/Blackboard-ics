import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AttendanceService } from '@core/services/attendance.service';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { AttendanceRegister, AttendanceRecord } from '@core/models';
import { ModifyAttendanceDialogComponent } from '../modify-attendance-dialog/modify-attendance-dialog.component';

interface CourseStudent {
  id: string;
  name: string;
  email: string;
  dni: string;
}

@Component({
  selector: 'app-attendance-list',
  standalone: false,
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss']
})
export class AttendanceListComponent implements OnInit {
  register: AttendanceRegister | null = null;
  isLoading = true;
  courseId: string;
  courseStudents: CourseStudent[] = [];

  // Form de sesión
  sessionWeek = 1;
  sessionNumber = 1;
  sessionDate: Date | null = null;
  sessionStart = '08:00';
  sessionEnd = '10:00';
  savingSession = false;

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
    private courseService: CourseService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  ngOnInit() {
    this.loadAttendance();
    this.loadCourseStudents();
  }

  loadAttendance() {
    this.isLoading = true;
    this.attendanceService.findByCourse(this.courseId).subscribe({
      next: (register) => {
        this.register = register;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        if (error.status === 404) {
          this.register = null;
        } else {
          this.notificationService.error('Error al cargar el registro de asistencia');
        }
        this.isLoading = false;
      },
    });
  }

  loadCourseStudents() {
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        const studentIds = course.students.map((s: any) => s.userId);
        this.userService.getUsers().subscribe({
          next: (users) => {
            this.courseStudents = users
              .filter(u => studentIds.includes(u._id))
              .map(u => ({
                id: u._id,
                name: `${u.names} ${u.lastNames}`.trim(),
                email: u.institutionalEmail,
                dni: u.dni,
              }));
          },
          error: (error) => console.error('Error loading students:', error),
        });
      },
      error: (error) => console.error('Error loading course:', error),
    });
  }

  createRegister() {
    this.attendanceService.create(this.courseId).subscribe({
      next: (register) => {
        this.register = register;
        this.notificationService.success('Registro de asistencia creado exitosamente');
      },
      error: (error) => {
        console.error('Error creating register:', error);
        const msg = error.error?.message || 'Error al crear el registro de asistencia';
        this.notificationService.error(msg);
      },
    });
  }

  addSession() {
    if (!this.register || !this.sessionDate) return;

    this.savingSession = true;

    // Construir fecha + hora de inicio/fin combinadas
    const date = new Date(this.sessionDate);
    const [sh, sm] = this.sessionStart.split(':').map(Number);
    const [eh, em] = this.sessionEnd.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(sh, sm, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(eh, em, 0, 0);

    this.attendanceService.addDate(
      this.register._id,
      date,
      startTime,
      endTime,
      Number(this.sessionWeek) || 1,
      Number(this.sessionNumber) || 1,
    ).subscribe({
      next: (register) => {
        this.register = register;
        this.savingSession = false;
        this.sessionWeek = 1;
        this.sessionNumber = 1;
        this.sessionDate = null;
        this.notificationService.success('Sesión agregada correctamente');
      },
      error: (error) => {
        console.error('Error adding session:', error);
        const msg = error.error?.message || 'Error al agregar la sesión';
        this.notificationService.error(msg);
        this.savingSession = false;
      },
    });
  }

  getRecord(dateIndex: number, studentId: string): AttendanceRecord | undefined {
    if (!this.register || !this.register.dates[dateIndex]) return undefined;
    return this.register.dates[dateIndex].records.find(
      (r: any) => r.studentId?.toString() === studentId
    );
  }

  markStudent(dateIndex: number, studentId: string, status: string) {
    if (!this.register) return;

    this.attendanceService.markAttendance(
      this.register._id,
      dateIndex,
      studentId,
      status,
    ).subscribe({
      next: (register) => {
        this.register = register;
        this.notificationService.success(`Marcado como ${status}`);
      },
      error: (error) => {
        console.error('Error marking attendance:', error);
        this.notificationService.error('Error al marcar asistencia');
      },
    });
  }

  modifyAttendance(dateIndex: number, record: AttendanceRecord) {
    if (!this.register) return;

    const student = this.courseStudents.find(s => s.id === record.studentId?.toString());

    const dialogRef = this.dialog.open(ModifyAttendanceDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        registerId: this.register._id,
        record: record,
        dateIndex: dateIndex,
        currentDate: this.register.dates[dateIndex].date,
        studentName: student?.name,
        studentDni: student?.dni,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAttendance();
        this.notificationService.success('Asistencia modificada exitosamente');
      }
    });
  }
}