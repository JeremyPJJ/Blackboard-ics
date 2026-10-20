import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface MaterialCreateResult {
  type: string;
  title: string;
  description: string;
  url?: string;
  file?: File;
  scheduledDate?: Date;
}

@Component({
  selector: 'app-material-create-dialog',
  standalone: false,
  templateUrl: './material-create-dialog.component.html',
  styleUrls: ['./material-create-dialog.component.scss']
})
export class MaterialCreateDialogComponent {
  type = 'pdf';
  title = '';
  description = '';
  url = '';
  file: File | null = null;
  private closing = false;

  constructor(
    private dialogRef: MatDialogRef<MaterialCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode?: 'session' } = {},
  ) {
    if (data?.mode === 'session') {
      this.type = 'pdf';
    }
  }

  onFileSelected(event: any) {
    const f = event.target.files?.[0];
    this.file = f || null;
  }

  save(): void {
    if (this.closing || !this.title.trim()) return;
    this.closing = true;

    const result: MaterialCreateResult = {
      type: this.type,
      title: this.title.trim(),
      description: this.description,
      url: this.url || undefined,
      file: this.file || undefined,
    };
    this.dialogRef.close(result);
  }
}
