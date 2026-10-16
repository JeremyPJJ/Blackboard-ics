import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { User, UserRole } from '@core/models';
import { MessagingStore } from '@features/messaging/store/messaging.store';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  isLoading = true;
  hasError = false;
  selectedRole = '';
  selectedStatus = '';
  searchTerm = '';
  displayedColumns: string[] = ['dni', 'name', 'email', 'role', 'status', 'actions'];
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private messagingStore: MessagingStore,
  ) {}

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  /** Solo super_admin puede crear conversación sin courseId (alcance del backend). */
  get isSuperAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'super_admin';
  }

  /** Abre (o crea) la conversación individual con el usuario y navega a /messaging. */
  async sendMessageTo(userId: string) {
    try {
      await this.messagingStore.findOrCreateConversation(userId);
      this.router.navigate(['/messaging']);
    } catch {
      // 403/error ya notificado por el store — no navegar (Spec R4)
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByUserId(index: number, user: User): string {
    return user._id;
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const role = params.get('role') || '';
      this.selectedRole = Object.values(UserRole).includes(role as UserRole) ? role : '';
      this.loadUsers();
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.hasError = false;
    
    const filters: any = {};
    if (this.selectedRole) filters.role = this.selectedRole;
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.searchTerm) filters.search = this.searchTerm;

    this.userService.getUsers(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.notificationService.error('Error al cargar los usuarios');
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  getRoleName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.UNIDAD_ACADEMICA]: 'Unidad Académica',
      [UserRole.SECRETARIA]: 'Secretaría',
      [UserRole.SOPORTE]: 'Soporte',
      [UserRole.DOCENTE]: 'Docente',
      [UserRole.ESTUDIANTE]: 'Estudiante',
    };
    return roleNames[role] || role;
  }

  getRoleChipClass(role: UserRole): string {
    const classes: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'chip-admin',
      [UserRole.UNIDAD_ACADEMICA]: 'chip-admin',
      [UserRole.SECRETARIA]: 'chip-staff',
      [UserRole.SOPORTE]: 'chip-staff',
      [UserRole.DOCENTE]: 'chip-teacher',
      [UserRole.ESTUDIANTE]: 'chip-student',
    };
    return classes[role] || '';
  }

  canDelete(user: User): boolean {
    return user.role !== UserRole.SUPER_ADMIN;
  }

  deleteUser(userId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Usuario',
        message: '¿Está seguro de eliminar este usuario? Esta acción moverá el usuario a la papelera.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.users = this.users.filter(u => u._id !== userId);
              this.notificationService.success('Usuario eliminado exitosamente');
            },
            error: (error) => {
              console.error('Error deleting user:', error);
              this.notificationService.error('Error al eliminar el usuario', 'Reintentar', () => this.deleteUser(userId));
            },
          });
      }
    });
  }
}
