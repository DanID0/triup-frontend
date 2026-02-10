import { Injectable } from '@angular/core';
import { User } from '../core/interface';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = "http://localhost:3000/user/profile";
  constructor(private http: HttpClient) {
    
  }

  async getUser():Promise<User> {
   const user = await lastValueFrom(this.http.get<User>(this.apiUrl,{withCredentials:true}));
  return user;
  }

}
//GET  http://localhost:<PORT>/user/profile