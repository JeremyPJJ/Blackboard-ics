import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-course-form',
  standalone: false,
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss']
})
export class CourseFormComponent implements OnInit {
  courseForm: FormGroup;
  isEdit = false;
  isLoading = false;
  errorMessage = '';
  courseId: string | null = null;
  docentes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      career: ['', Validators.required],
      description: [''],
      credits: [null],
      year: [new Date().getFullYear()],
      semester: [1],
      cycle: [1],
      teacherId: [''],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      status: ['activo', Validators.required],
    }, { validators: this.dateRangeValidator });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return { dateRangeInvalid: true };
    }

    return null;
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('id');

    if (this.courseId) {
      this.isEdit = true;
      this.loadCourse();
    }

    // Cargar docentes para designación (admin)
    if (this.isAdmin) {
      this.userService.getUsers({ role: 'docente' }).subscribe({
        next: (users) => { this.docentes = users; },
        error: () => {},
      });
    }
  }

  loadCourse() {
    if (!this.courseId) return;

    this.isLoading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.courseForm.patchValue({
          name: course.name,
          code: course.code,
          career: course.career,
          description: course.description,
          credits: course.credits,
          year: course.year,
          semester: course.semester,
          cycle: course.cycle,
          startDate: new Date(course.startDate),
          endDate: new Date(course.endDate),
          status: course.status,
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.isLoading = false;
        this.errorMessage = 'Error al cargar el curso';
      },
    });
  }

  onSubmit() {
    if (this.courseForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { teacherId, ...courseData } = this.courseForm.value;

    if (this.isEdit && this.courseId) {
      this.courseService.updateCourse(this.courseId, courseData).subscribe({
        next: () => {
          // Admin: designar docente al curso existente
          if (teacherId) {
            this.courseService.addParticipant(this.courseId, teacherId, 'teacher').subscribe({
              next: () => {
                this.isLoading = false;
                this.notificationService.success('Curso actualizado con docente asignado');
                this.router.navigate(['/courses']);
              },
              error: (error) => {
                console.error('Error asignando docente:', error);
                this.isLoading = false;
                this.notificationService.warning('Curso actualizado, pero no se pudo asignar el docente: ' + (error.error?.message || 'error'));
                this.router.navigate(['/courses']);
              },
            });
            return;
          }
          this.isLoading = false;
          this.notificationService.success('Curso actualizado exitosamente');
          this.router.navigate(['/courses']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar el curso';
          this.notificationService.error(this.errorMessage);
        },
      });
    } else {
      this.courseService.createCourse(courseData).subscribe({
        next: (course) => {
          // Admin: designar docente al curso
          if (teacherId) {
            this.courseService.addParticipant(course._id, teacherId, 'teacher').subscribe({
              next: () => {
                this.isLoading = false;
                this.notificationService.success('Curso creado con docente asignado');
                this.router.navigate(['/courses']);
              },
              error: (error) => {
                console.error('Error asignando docente:', error);
                this.isLoading = false;
                this.notificationService.warning('Curso creado, pero no se pudo asignar el docente: ' + (error.error?.message || 'error'));
                this.router.navigate(['/courses']);
              },
            });
            return;
          }
          this.isLoading = false;
          this.notificationService.success('Curso creado exitosamente');
          this.router.navigate(['/courses']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al crear el curso';
          this.notificationService.error(this.errorMessage);
        },
      });
    }
  }
}
