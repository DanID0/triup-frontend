import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Workspace } from '../core/interface';

export interface CreateWorkspacePayload {
  name: string;
  accessType?: 'Public' | 'Privates';
}

export type UpdateWorkspacePayload = Partial<CreateWorkspacePayload>;

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/workspaces';

  async getWorkspaces(): Promise<Workspace[]> {
    return await lastValueFrom(
      this.http.get<Workspace[]>(this.apiUrl, { withCredentials: true }),
    );
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return await lastValueFrom(
      this.http.get<Workspace>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }

  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    return await lastValueFrom(
      this.http.post<Workspace>(this.apiUrl, payload, { withCredentials: true }),
    );
  }

  async updateWorkspace(id: string, payload: UpdateWorkspacePayload): Promise<Workspace> {
    return await lastValueFrom(
      this.http.patch<Workspace>(`${this.apiUrl}/${id}`, payload, { withCredentials: true }),
    );
  }

  async deleteWorkspace(id: string): Promise<void> {
    await lastValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }
}
