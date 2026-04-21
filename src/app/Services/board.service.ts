import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Board } from '../core/interface';

export interface UpdateBoardPayload {
  name?: string;
  backgroundImageUrl?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/boards';

  async getBoardsByWorkspace(workspaceId: string): Promise<Board[]> {
    return await lastValueFrom(
      this.http.get<Board[]>(`${this.apiUrl}/workspace/${workspaceId}`, {
        withCredentials: true,
      }),
    );
  }

  async getBoard(id: string): Promise<Board> {
    return await lastValueFrom(
      this.http.get<Board>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }

  async createBoard(payload: { workspaceId: string; name: string }): Promise<Board> {
    return await lastValueFrom(
      this.http.post<Board>(this.apiUrl, payload, { withCredentials: true }),
    );
  }

  async updateBoard(id: string, payload: UpdateBoardPayload): Promise<Board> {
    return await lastValueFrom(
      this.http.patch<Board>(`${this.apiUrl}/${id}`, payload, { withCredentials: true }),
    );
  }

  async deleteBoard(id: string): Promise<void> {
    await lastValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }
}
