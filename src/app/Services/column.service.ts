import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Column } from '../core/interface';

export interface CreateColumnPayload {
  boardId: string;
  name?: string;
  color: string;
  position?: number;
}

export type UpdateColumnPayload = Partial<Pick<CreateColumnPayload, 'name' | 'color' | 'position'>>;

@Injectable({
  providedIn: 'root',
})
export class ColumnService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/column';

  async getColumns(boardId?: string): Promise<Column[]> {
    const url = boardId ? `${this.apiUrl}?boardId=${boardId}` : this.apiUrl;
    return await lastValueFrom(this.http.get<Column[]>(url, { withCredentials: true }));
  }

  async getColumn(id: string): Promise<Column> {
    return await lastValueFrom(
      this.http.get<Column>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }

  async createColumn(payload: CreateColumnPayload): Promise<Column> {
    return await lastValueFrom(
      this.http.post<Column>(this.apiUrl, payload, { withCredentials: true }),
    );
  }

  async updateColumn(id: string, payload: UpdateColumnPayload): Promise<Column> {
    return await lastValueFrom(
      this.http.patch<Column>(`${this.apiUrl}/${id}`, payload, { withCredentials: true }),
    );
  }

  async deleteColumn(id: string): Promise<void> {
    await lastValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }
}
