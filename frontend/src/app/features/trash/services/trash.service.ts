import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrashEntry } from '../models/trash.model';

/**
 * Acceso REST a los endpoints de la papelera
 * (Spec: Trash — list non-restored entries, restore, permanent delete).
 */
@Injectable({
  providedIn: 'root',
})
export class TrashService {
  private apiUrl = '/api/trash';

  constructor(private http: HttpClient) {}

  getTrashEntries(): Observable<TrashEntry[]> {
    return this.http.get<TrashEntry[]>(this.apiUrl);
  }

  restore(id: string): Observable<TrashEntry> {
    return this.http.post<TrashEntry>(`${this.apiUrl}/${id}/restore`, {});
  }

  permanentlyDelete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}