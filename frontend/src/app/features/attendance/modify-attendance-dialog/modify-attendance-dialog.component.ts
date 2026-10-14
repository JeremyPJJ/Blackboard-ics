import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import { NotificationService } from '@core/services/notification.service';
import { AttendanceRecord, AttendanceStatus } from '@core/models';

export interface ModifyAttendanceDialogData {
  registerId: string;
  record: AttendanceRecord;
  dateIndex: number;
  currentDate: Date;
  studentName?: string;
  studentDni?: string;
}

@Component({
  selector: 'app-modify-attendance-dialog',
  standalone: false,
  templateUrl: './modify-attendance-dialog.component.html',
  styleUrls: ['./modify-attendance-dialog.component.scss']
})
export class ModifyAttendanceDialogComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModifyAttendanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModifyAttendanceDialogData,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      status: [data.record.status || 'ausente', Validators.required],
      reason: ['']
    });
  }

  ngOnInit() {
    // Agregar validación condicional para reason
    this.form.get('status').valueChanges.subscribe(status => {
      const reasonControl = this.form.get('reason');
      if (status === 'justificado') {
        reasonControl.setValidators([Validators.required]);
      } else {
        reasonControl.clearValidators();
      }
      reasonControl.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const formData = this.form.value;

    this.attendanceService.modifyAttendance(
      this.data.registerId,
      this.data.dateIndex,
      this.data.record.studentId,
      formData.status,
      formData.reason
    ).subscribe({
      next: (record) => {
        this.dialogRef.close(record);
      },
      error: (error) => {
        console.error('Error modifying attendance:', error);
        this.notificationService.error('Error al modificar la asistencia', 'Reintentar', () => this.onSubmit());
        this.isSubmitting = false;
      }
    });
  }
}
