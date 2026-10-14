import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ForumService, Forum } from '@core/services/forum.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CreateForumDialogComponent } from './create-forum-dialog.component';

@Component({
  selector: 'app-forums',
  standalone: false,
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.scss'],
})
export class ForumsComponent implements OnInit {
  forums: Forum[] = [];
  isLoading = true;
  courseId: string;

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
  ) {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
  }

  ngOnInit() {
    this.loadForums();
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  loadForums() {
    this.isLoading = true;
    this.forumService.getForumsByCourse(this.courseId).subscribe({
      next: (forums) => {
        this.forums = forums;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  openCreate() {
    const dialogRef = this.dialog.open(CreateForumDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data: { courseId: this.courseId },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadForums();
        this.notificationService.success('Foro creado');
      }
    });
  }
}