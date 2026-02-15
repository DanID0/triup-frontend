import { Injectable } from '@angular/core';
import { User } from '../core/interface';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/user';

  constructor(private http: HttpClient) {}

  async getUser(): Promise<User> {
    return lastValueFrom(
      this.http.get<User>(`${this.apiUrl}/profile`, { withCredentials: true })
    );
  }

  async logOut(): Promise<void> {
    return lastValueFrom(
      this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
    );
  }
}
