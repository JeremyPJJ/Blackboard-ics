import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { SurveyService, Survey } from './core/services/survey.service';
import { SurveysStore } from './core/services/surveys.store';
import { NotificationsStore } from './core/services/notifications.store';
import { MessagingStore } from '@features/messaging/store/messaging.store';
import { JobsStore } from '@features/jobs/store/jobs.store';
import { JobsService } from '@features/jobs/services/jobs.service';
import { ProfileDialogComponent } from '@features/profile/profile-dialog/profile-dialog.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isAdmin = false;
  isLoginPage = false;
  isMessagingPage = false;
  private authSubscription: Subscription;
  private routerSubscription: Subscription;
  private readonly siteName = 'SIGA-ICS';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private titleService: Title,
    private dialog: MatDialog,
    readonly messagingStore: MessagingStore,
    readonly notificationsStore: NotificationsStore,
    readonly jobsStore: JobsStore,
    readonly surveysStore: SurveysStore,
    private jobsService: JobsService,
    private surveyService: SurveyService,
  ) { }

  get userName(): string {
    const u = this.authService.getCurrentUser();
    return u ? `${u.names} ${u.lastNames || ''}`.trim() : '';
  }

  get roleLabel(): string {
    const role = this.authService.getCurrentUser()?.role;
    const labels: Record<string, string> = {
      super_admin: 'Administrador',
      unidad_academica: 'Unidad Académica',
      secretaria: 'Secretaría',
      soporte: 'Soporte Técnico',
      docente: 'Docente',
      estudiante: 'Estudiante',
    };
    return labels[role || ''] || 'Usuario';
  }

  /** ¿Puede gestionar ofertas? Misma regla que job-list (ofertas.crear). */
  get canManageJobs(): boolean {
    return this.authService.hasPermission('ofertas.crear');
  }

  /** ¿Puede ver la lista de ofertas? (ofertas.ver — el docente la pierde). */
  get canViewJobs(): boolean {
    return this.authService.hasPermission('ofertas.ver');
  }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.isAdmin = this.authService.isAdmin();
      if (user) {
        // Socket global de mensajería: necesario para snackbar + campana
        // (Spec O6b) fuera de la vista /messaging.
        this.messagingStore.connect();
        this.refreshBadges();
      } else {
        this.surveysStore.setPending(0);
        this.jobsStore.setJobs([]);
        this.messagingStore.disconnect();
      }
    });

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLoginPage = event.urlAfterRedirects === '/login';
      this.isMessagingPage = event.urlAfterRedirects.startsWith('/messaging');
      this.updateTitle();
      // Offline (WS caído): los counts se recalculan vía REST al navegar
      // (Spec O6b esc. Offline — sin doble conteo, REST es autoritativo).
      if (this.isAuthenticated) {
        this.refreshBadges();
      }
    });

    // Check initial route
    this.isLoginPage = this.router.url === '/login';
    this.isMessagingPage = this.router.url.startsWith('/messaging');
    this.updateTitle();
    this.startExpiryWatcher();
  }

  /**
   * Recarga los datos de los tres badges (Spec O6b):
   * - Mensajería: `MessagingStore.totalUnread` (reactivo, se recalcula en REST).
   * - Encuestas: pendientes por targetRole + ventana de fechas + sin responder.
   * - Ofertas: activas (status 'activa' && deadline >= now).
   */
  private refreshBadges(): void {
    this.messagingStore.loadConversations();
    this.notificationsStore.load();

    const me = this.authService.getCurrentUser();
    if (!me) {
      return;
    }

    this.surveyService.getSurveys().subscribe({
      next: (surveys) => {
        this.surveysStore.setPending(this.countPendingSurveys(surveys, me));
      },
      error: () => {
        this.surveysStore.setPending(0);
      },
    });

    this.jobsService.getJobs().subscribe({
      next: (jobs) => this.jobsStore.setJobs(jobs),
      error: () => this.jobsStore.setJobs([]),
    });
  }

  /** Mismo filtro que surveys.component (targetRole + fechas + !answered). */
  private countPendingSurveys(surveys: Survey[], me: { _id: string; role?: string }): number {
    const now = new Date();
    return surveys.filter(
      (s) =>
        (s.targetRole === 'todos' || s.targetRole === me.role) &&
        s.isActive !== false &&
        new Date(s.startDate) <= now &&
        new Date(s.endDate) >= now &&
        !(s.responses || []).some((r: any) => r.userId?.toString() === me._id),
    ).length;
  }

  private expiryWarned = false;
  private startExpiryWatcher() {
    setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const msLeft = payload.exp * 1000 - Date.now();
        if (msLeft > 0 && msLeft < 5 * 60 * 1000 && !this.expiryWarned) {
          this.expiryWarned = true;
          this.notificationService.warning('Su sesión está por vencer. Guarde su trabajo e inicie sesión nuevamente.');
        }
      } catch { /* token inválido, ignorar */ }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateTitle() {
    let currentRoute = this.router.routerState.snapshot.root;
    let pageTitle: string | undefined;

    while (currentRoute) {
      if (currentRoute.data && currentRoute.data['title']) {
        pageTitle = currentRoute.data['title'];
      }
      currentRoute = currentRoute.firstChild!;
    }

    // Fallback por URL si el data no está disponible
    if (!pageTitle) {
      pageTitle = this.titleFromUrl(this.router.url);
    }

    this.titleService.setTitle(
      pageTitle ? `${pageTitle} | ${this.siteName}` : this.siteName
    );
  }

  private titleFromUrl(url: string): string | undefined {
    const map: Record<string, string> = {
      '/login': 'Iniciar Sesión',
      '/dashboard/admin': 'Dashboard Administrativo',
      '/dashboard/teacher': 'Dashboard Docente',
      '/dashboard/student': 'Mi Aprendizaje',
      '/users': 'Gestión de Usuarios',
      '/courses': 'Gestión de Cursos',
      '/my-tasks': 'Mis Tareas',
    };
    if (map[url]) return map[url];
    if (url.startsWith('/courses/')) return 'Detalle del Curso';
    if (url.startsWith('/my-tasks/')) return 'Detalle de Tarea';
    if (url.startsWith('/users/')) return 'Usuario';
    return undefined;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.messagingStore.disconnect();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearSession();
        this.messagingStore.disconnect();
        this.router.navigate(['/login']);
      }
    });
  }

  goToDashboard() {
    const role = this.authService.getCurrentUser()?.role;
    if (role === 'docente') {
      this.router.navigate(['/dashboard/teacher']);
    } else if (role === 'estudiante') {
      this.router.navigate(['/dashboard/student']);
    } else {
      this.router.navigate(['/dashboard/admin']);
    }
  }

  /** Abre el diálogo de perfil desde la barra de navegación (Spec: "Mi perfil"). */
  openProfile(): void {
    this.dialog.open(ProfileDialogComponent, {
      width: '520px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      disableClose: true,
      autoFocus: false,
    });
  }

  /**
   * Abre la papelera como MODAL (Spec: Trash UI — "Admin opens trash").
   *
   * Valida `isAdmin` en el click (el RoleGuard de la ruta no aplica al abrir
   * por diálogo), importa el componente standalone de forma dinámica (lazy,
   * chunk < 500KB) y lo muestra en un MatDialog de ~900px / maxWidth 96vw.
   * La ruta /trash queda como deep-link fallback con loadComponent + guards.
   */
  async openTrash(): Promise<void> {
    if (!this.isAdmin) return;
    const { TrashListComponent } = await import(
      '@features/trash/trash-list/trash-list.component'
    );
    this.dialog.open(TrashListComponent, {
      width: '900px',
      maxWidth: '96vw',
      autoFocus: false,
    });
  }
}
