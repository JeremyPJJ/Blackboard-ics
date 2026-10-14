import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ForumService, Forum, ForumPost } from '@core/services/forum.service';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CreateForumDialogComponent } from '../forums/create-forum-dialog.component';

@Component({
  selector: 'app-forum-detail',
  standalone: false,
  templateUrl: './forum-detail.component.html',
  styleUrls: ['./forum-detail.component.scss'],
})
export class ForumDetailComponent implements OnInit, OnDestroy {
  forum: Forum | null = null;
  isLoading = true;
  forumId: string;
  newPost = '';
  replyTexts: Record<number, string> = {};
  replyToReplyTexts: Record<string, string> = {};
  authorMap: Record<string, { name: string; role: string }> = {};
  evaluations: any[] = [];
  scoreInputs: Record<string, number> = {};
  participants: { id: string; name: string }[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private userService: UserService,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
  ) {
    this.forumId = this.route.snapshot.paramMap.get('forumId') || '';
  }

  ngOnInit() {
    this.loadForum();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentUserId(): string {
    return this.authService.getCurrentUser()?._id || '';
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  loadForum() {
    this.isLoading = true;
    this.forumService.getForum(this.forumId).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.resolveAuthors(forum);
        this.loadParticipantsAndEvaluations();
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  private loadParticipantsAndEvaluations() {
    if (!this.forum) return;

    this.forumService.getEvaluations(this.forum._id).subscribe({
      next: (evals) => {
        this.evaluations = evals;
        evals.forEach((e) => {
          this.scoreInputs[e.userId] = e.score;
        });
      },
      error: () => {},
    });

    this.courseService.getCourseById(this.forum.courseId).subscribe({
      next: (course) => {
        const studentIds = course.students.map((s: any) => s.userId);
        this.userService.getUsers().subscribe({
          next: (users) => {
            this.participants = users
              .filter((u) => studentIds.includes(u._id))
              .map((u) => ({ id: u._id, name: `${u.names} ${u.lastNames}`.trim() }));
          },
          error: () => {},
        });
      },
      error: () => {},
    });
  }

  get isTeacher(): boolean {
    return this.authService.getCurrentUser()?.role === 'docente';
  }

  getScoreFor(userId: string): number {
    const val = this.scoreInputs[userId];
    return val ?? 0;
  }

  // Posts del estudiante en el foro (incluye replies)
  postsByStudent(studentId: string): { text: string; date: Date; type: 'post' | 'reply' }[] {
    if (!this.forum) return [];
    const out: { text: string; date: Date; type: 'post' | 'reply' }[] = [];
    this.forum.posts.forEach((post) => {
      if (post.authorId?.toString() === studentId) {
        out.push({ text: post.content, date: new Date(post.createdAt), type: 'post' });
      }
      (post.replies || []).forEach((reply: any) => {
        if (reply.authorId?.toString() === studentId) {
          out.push({ text: reply.content, date: new Date(reply.createdAt), type: 'reply' });
        }
        (reply.replies || []).forEach((nested: any) => {
          if (nested.authorId?.toString() === studentId) {
            out.push({ text: nested.content, date: new Date(nested.createdAt), type: 'reply' });
          }
        });
      });
    });
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  saveEvaluation(userId: string) {
    if (!this.forum) return;
    const score = Number(this.scoreInputs[userId]) || 0;
    this.forumService.evaluateParticipant(this.forum._id, userId, score).subscribe({
      next: () => this.notificationService.success('Calificación guardada'),
      error: (error) => this.notificationService.error(error.error?.message || 'Error al guardar'),
    });
  }

  openEdit() {
    if (!this.forum) return;
    const dialogRef = this.dialog.open(CreateForumDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data: { courseId: this.forum.courseId, forum: this.forum },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.forum = result;
        this.notificationService.success('Foro actualizado');
      }
    });
  }

  private resolveAuthors(forum: Forum) {
    const ids = new Set<string>();
    forum.posts.forEach((p) => {
      ids.add(p.authorId);
      p.replies.forEach((r: any) => r.authorId && ids.add(r.authorId));
    });
    const idList = [...ids];
    if (idList.length === 0) return;

    this.userService.getUsers().subscribe({
      next: (users) => {
        users.forEach((u) => {
          if (idList.includes(u._id)) {
            this.authorMap[u._id] = { name: `${u.names} ${u.lastNames}`.trim(), role: u.role };
          }
        });
      },
      error: () => {},
    });
  }

  authorName(id: string): string {
    return this.authorMap[id]?.name || id;
  }

  authorRole(id: string): string {
    return this.authorMap[id]?.role || '';
  }

  isAuthor(id: string): boolean {
    return id === this.currentUserId;
  }

  submitPost() {
    const content = (this.newPost || '').trim();
    if (!content || !this.forum || this.forum.isLocked) return;
    this.forumService.addPost(this.forum._id, content).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.newPost = '';
        this.resolveAuthors(forum);
      },
      error: (error) => this.notificationService.error(error.error?.message || 'Error al publicar'),
    });
  }

  submitReply(postIndex: number) {
    const content = (this.replyTexts[postIndex] || '').trim();
    if (!content || !this.forum || this.forum.isLocked) return;
    this.forumService.addReply(this.forum._id, postIndex, content).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.replyTexts[postIndex] = '';
        this.resolveAuthors(forum);
      },
      error: (error) => this.notificationService.error(error.error?.message || 'Error al responder'),
    });
  }

  submitReplyToReply(postIndex: number, replyIndex: number) {
    const key = `${postIndex}-${replyIndex}`;
    const content = (this.replyToReplyTexts[key] || '').trim();
    if (!content || !this.forum || this.forum.isLocked) return;
    this.forumService.addReplyToReply(this.forum._id, postIndex, replyIndex, content).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.replyToReplyTexts[key] = '';
        this.resolveAuthors(forum);
      },
      error: (error) => this.notificationService.error(error.error?.message || 'Error al responder'),
    });
  }

  toggleReact(postIndex: number) {
    if (!this.forum) return;
    this.forumService.react(this.forum._id, postIndex).subscribe({
      next: (forum) => this.forum = forum,
      error: () => {},
    });
  }

  hasReacted(post: ForumPost): boolean {
    return post.reactions?.includes(this.currentUserId) || false;
  }

  toggleLock() {
    if (!this.forum) return;
    this.forumService.toggleLock(this.forum._id, !this.forum.isLocked).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.notificationService.success(forum.isLocked ? 'Foro cerrado' : 'Foro abierto');
      },
      error: () => {},
    });
  }

  removePost(postIndex: number) {
    if (!this.forum) return;
    if (!confirm('¿Eliminar esta publicación y sus respuestas?')) return;
    this.forumService.removePost(this.forum._id, postIndex).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.resolveAuthors(forum);
        this.notificationService.success('Publicación eliminada');
      },
      error: (error) => this.notificationService.error(error.error?.message || 'Error al eliminar'),
    });
  }

  removeReply(postIndex: number, replyIndex: number) {
    if (!this.forum) return;
    if (!confirm('¿Eliminar esta respuesta?')) return;
    this.forumService.removeReply(this.forum._id, postIndex, replyIndex).subscribe({
      next: (forum) => {
        this.forum = forum;
        this.resolveAuthors(forum);
        this.notificationService.success('Respuesta eliminada');
      },
      error: (error) => this.notificationService.error(error.error?.message || 'Error al eliminar'),
    });
  }
}