import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { User } from '../core/interface';

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
  interfaceLanguage?: 'LATVIAN' | 'ENGLISH';
  avatarUrl?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://dani.gavrusa.com/api';

  async getUser(): Promise<User> {
    return await lastValueFrom(
      this.http.get<User>(`${this.baseUrl}/user/profile`, { withCredentials: true }),
    );
  }

  async signup(payload: SignupPayload): Promise<User> {
    return await lastValueFrom(
      this.http.post<User>(`${this.baseUrl}/user`, payload, { withCredentials: true }),
    );
  }

  async login(payload: LoginPayload): Promise<void> {
    await lastValueFrom(
      this.http.post(`${this.baseUrl}/auth/login`, payload, { withCredentials: true }),
    );
  }

  refresh(): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${this.baseUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    );
  }

  async logOut(): Promise<void> {
    await lastValueFrom(
      this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true }),
    );
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return await lastValueFrom(
      this.http.patch<User>(`${this.baseUrl}/user/profile`, payload, {
        withCredentials: true,
      }),
    );
  }
}
