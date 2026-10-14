import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface MeetingTitleDialogData {
  courseName: string;
}

/**
 * Dialog del PRIMER entrante a la sala (Spec F2). Pide un título opcional para
 * la reunión (pre-rellenado con "Reunión de <curso>"). El usuario puede
 * confirmar con el título o "unirse sin título" (envía undefined → el backend
 * usa el default 'Reunión'). No bloquea a los siguientes entrantes: estos
 * reusan la sesión abierta sin pasar por este dialog.
 */
@Component({
  selector: 'app-meeting-title-dialog',
  standalone: false,
  templateUrl: './meeting-title-dialog.component.html',
})
export class MeetingTitleDialogComponent {
  title: string;

  constructor(
    public dialogRef: MatDialogRef<MeetingTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MeetingTitleDialogData,
  ) {
    this.title = `Reunión de ${data.courseName}`.trim();
  }

  confirm(): void {
    this.dialogRef.close(this.title.trim() || undefined);
  }

  skip(): void {
    this.dialogRef.close(undefined);
  }
}
