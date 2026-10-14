import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadedFile {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  contextType: string;
  referenceId: string;
  uploadedBy: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private apiUrl = '/api/files';

  constructor(private http: HttpClient) {}

  upload(file: File, contextType: string, referenceId: string): Observable<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contextType', contextType);
    formData.append('referenceId', referenceId);
    return this.http.post<UploadedFile>(`${this.apiUrl}/upload`, formData);
  }

  getDownloadUrl(fileId: string): string {
    return `${this.apiUrl}/${fileId}`;
  }

  /** Abre el archivo en una pestaña nueva (PDFs e imágenes se visualizan) */
  preview(fileId: string): void {
    this.http.get(`${this.apiUrl}/${fileId}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Error al visualizar archivo:', err);
      },
    });
  }

  /** Descarga con autenticación (evita 401 porque usa el interceptor) */
  download(fileId: string, fallbackName = 'archivo'): void {
    this.getBlob(fileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando archivo:', err);
      },
    });
  }

  getBlob(fileId: string) {
    return this.http.get(`${this.apiUrl}/${fileId}`, { responseType: 'blob' });
  }

  findByContext(contextType: string, referenceId: string): Observable<UploadedFile[]> {
    return this.http.get<UploadedFile[]>(`${this.apiUrl}/context/${contextType}/${referenceId}`);
  }
}