import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Board, InvitedUserRights, UserBoard } from '../core/interface';

@Injectable({ providedIn: 'root' })
export class BoardMembersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/boards';

  list(boardId: string): Promise<UserBoard[]> {
    return lastValueFrom(
      this.http.get<UserBoard[]>(`${this.apiUrl}/${boardId}/members`, {
        withCredentials: true,
      }),
    );
  }

  add(
    boardId: string,
    email: string,
    rights: InvitedUserRights = InvitedUserRights.Member,
  ): Promise<UserBoard> {
    return lastValueFrom(
      this.http.post<UserBoard>(
        `${this.apiUrl}/${boardId}/members`,
        { email, rights },
        { withCredentials: true },
      ),
    );
  }

  update(
    boardId: string,
    memberId: string,
    rights: InvitedUserRights,
  ): Promise<UserBoard> {
    return lastValueFrom(
      this.http.patch<UserBoard>(
        `${this.apiUrl}/${boardId}/members/${memberId}`,
        { rights },
        { withCredentials: true },
      ),
    );
  }

  remove(boardId: string, memberId: string): Promise<void> {
    return lastValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${boardId}/members/${memberId}`, {
        withCredentials: true,
      }),
    );
  }

  enableShare(boardId: string): Promise<Board> {
    return lastValueFrom(
      this.http.post<Board>(
        `${this.apiUrl}/${boardId}/share`,
        {},
        { withCredentials: true },
      ),
    );
  }

  disableShare(boardId: string): Promise<Board> {
    return lastValueFrom(
      this.http.delete<Board>(`${this.apiUrl}/${boardId}/share`, {
        withCredentials: true,
      }),
    );
  }

  getPublicBoard(token: string): Promise<Board> {
    return lastValueFrom(
      this.http.get<Board>(`${this.apiUrl}/public/${token}`, {
        withCredentials: true,
      }),
    );
  }

  joinViaShareToken(token: string): Promise<Board> {
    return lastValueFrom(
      this.http.post<Board>(
        `${this.apiUrl}/public/${token}/join`,
        {},
        { withCredentials: true },
      ),
    );
  }
}
