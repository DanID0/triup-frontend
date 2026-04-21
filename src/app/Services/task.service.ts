import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Task } from '../core/interface';

export interface CreateTaskPayload {
  name: string;
  columnId: string;
  dueDate?: string;
  priority?: string;
  description?: string;
  assigneeId?: string;
}

export type UpdateTaskPayload = Partial<
  Pick<
    Task,
    | 'name'
    | 'description'
    | 'dueDate'
    | 'priority'
    | 'assigneeId'
    | 'columnId'
    | 'completed'
    | 'labels'
    | 'attachments'
  >
>;

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/task';

  async getTasks(columnId?: string): Promise<Task[]> {
    const url = columnId ? `${this.apiUrl}?columnId=${columnId}` : this.apiUrl;
    return await lastValueFrom(this.http.get<Task[]>(url, { withCredentials: true }));
  }

  async getTask(id: string): Promise<Task> {
    return await lastValueFrom(
      this.http.get<Task>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    return await lastValueFrom(
      this.http.post<Task>(this.apiUrl, payload, { withCredentials: true }),
    );
  }

  async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
    return await lastValueFrom(
      this.http.patch<Task>(`${this.apiUrl}/${id}`, payload, { withCredentials: true }),
    );
  }

  async deleteTask(id: string): Promise<void> {
    await lastValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }

  async moveTask(id: string, columnId: string): Promise<Task> {
    return await lastValueFrom(
      this.http.patch<Task>(
        `${this.apiUrl}/${id}`,
        { columnId },
        { withCredentials: true },
      ),
    );
  }
}
