import { Injectable } from '@angular/core';
import { Task } from '../core/interface';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class BoardService {
  constructor(private http: HttpClient) {}
  async createTask(  name: string, email: string, columnId: string,dueDate: string, priority: string, description?: string, asignee?:string) {
    await lastValueFrom(this.http.post<Task>('http://localhost:3000/task', { name, description, dueDate, columnId, asignee, priority }, {withCredentials:true}));

   }
   async getTask():Promise<Task> {
    const task = await lastValueFrom(this.http.get<Task>('http://localhost:3000/task',{withCredentials:true}));
   return task;
   }
}
