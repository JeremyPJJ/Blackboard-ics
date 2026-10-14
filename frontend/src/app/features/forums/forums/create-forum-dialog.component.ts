import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ForumService, Forum } from '@core/services/forum.service';

export interface CreateForumDialogData {
  courseId: string;
  weekNumber?: number;
  forum?: Forum;
}

@Component({
  selector: 'app-create-forum-dialog',
  standalone: false,
  templateUrl: './create-forum-dialog.component.html',
  styleUrls: ['./create-forum-dialog.component.scss']
})
export class CreateForumDialogComponent {
  title = '';
  description = '';
  weekNumber = 1;
  sessionNumber = 1;
  isEvaluated = false;
  isLocked = false;
  availableFrom: Date | null = null;
  isEdit = false;
  private forumId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<CreateForumDialogComponent>,
    private forumService: ForumService,
    @Inject(MAT_DIALOG_DATA) public data: CreateForumDialogData,
  ) {
    if (data.weekNumber) {
      this.weekNumber = data.weekNumber;
    }

    if (data.forum) {
      this.isEdit = true;
      this.forumId = data.forum._id;
      this.title = data.forum.title;
      this.description = data.forum.description || '';
      this.weekNumber = data.forum.weekNumber;
      this.sessionNumber = data.forum.sessionNumber;
      this.isEvaluated = !!data.forum.isEvaluated;
      this.isLocked = !!data.forum.isLocked;
      this.availableFrom = data.forum.availableFrom ? new Date(data.forum.availableFrom) : null;
    }
  }

  save(): void {
    if (!this.title) return;

    const payload: any = {
      title: this.title.trim(),
      description: this.description,
      weekNumber: Number(this.weekNumber) || 1,
      sessionNumber: Number(this.sessionNumber) || 1,
      isEvaluated: this.isEvaluated,
      isLocked: this.isLocked,
      availableFrom: this.availableFrom || null,
    };

    if (this.isEdit && this.forumId) {
      this.forumService.updateForum(this.forumId, payload).subscribe({
        next: (forum) => this.dialogRef.close(forum),
        error: () => this.dialogRef.close(null),
      });
    } else {
      this.forumService.createForum({
        ...payload,
        courseId: this.data.courseId,
      }).subscribe({
        next: (forum) => this.dialogRef.close(forum),
        error: () => this.dialogRef.close(null),
      });
    }
  }
}