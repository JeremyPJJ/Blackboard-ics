import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { CourseService } from '@core/services/course.service';
import { TaskService } from '@core/services/task.service';
import { Course, Task, TaskSubmission } from '@core/models';

interface StudentTaskItem {
  task: Task;
  course: Course;
  status: 'pendiente' | 'entregado' | 'calificado';
  submission?: TaskSubmission;
}

@Component({
  selector: 'app-student-tasks',
  standalone: false,
  templateUrl: './student-tasks.component.html',
  styleUrls: ['./student-tasks.component.scss']
})
export class StudentTasksComponent implements OnInit, OnDestroy {
  items: StudentTaskItem[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private taskService: TaskService,
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.courseService.getCourses({ studentId: user._id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          let pending = courses.length;
          const allItems: StudentTaskItem[] = [];

          if (courses.length === 0) {
            this.items = [];
            this.isLoading = false;
            return;
          }

          courses.forEach(course => {
            this.taskService.getTasksByCourse(course._id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (tasks) => {
                  if (tasks.length === 0) {
                    pending--;
                    if (pending === 0) {
                      this.items = allItems;
                      this.isLoading = false;
                    }
                    return;
                  }
                  tasks.forEach(task => {
                    this.loadSubmissionStatus(task, course, allItems, () => {
                      pending--;
                      if (pending === 0) {
                        this.items = allItems;
                        this.isLoading = false;
                      }
                    });
                  });
                },
                error: () => {
                  pending--;
                  if (pending === 0) {
                    this.items = allItems;
                    this.isLoading = false;
                  }
                },
              });
          });
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private loadSubmissionStatus(
    task: Task,
    course: Course,
    allItems: StudentTaskItem[],
    done: () => void
  ) {
    const user = this.authService.getCurrentUser();
    this.taskService.getSubmissions(task._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (submissions) => {
          const mine = submissions.find(s => s.studentId?.toString() === user?._id);
          const status: StudentTaskItem['status'] = !mine
            ? 'pendiente'
            : (mine.status === 'revisado' || mine.score !== undefined ? 'calificado' : 'entregado');
          allItems.push({ task, course, status, submission: mine });
          done();
        },
        error: () => {
          allItems.push({ task, course, status: 'pendiente' });
          done();
        },
      });
  }
}