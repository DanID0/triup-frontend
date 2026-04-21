import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Comment } from '../core/interface';

export interface CreateCommentPayload {
  taskId: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/comment';

  getByTask(taskId: string): Promise<Comment[]> {
    return lastValueFrom(
      this.http.get<Comment[]>(`${this.apiUrl}?taskId=${taskId}`, {
        withCredentials: true,
      }),
    );
  }

  create(payload: CreateCommentPayload): Promise<Comment> {
    return lastValueFrom(
      this.http.post<Comment>(this.apiUrl, payload, { withCredentials: true }),
    );
  }

  update(id: string, content: string): Promise<Comment> {
    return lastValueFrom(
      this.http.patch<Comment>(
        `${this.apiUrl}/${id}`,
        { content },
        { withCredentials: true },
      ),
    );
  }

  delete(id: string): Promise<void> {
    return lastValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }
}
