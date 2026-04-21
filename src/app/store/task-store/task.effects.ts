import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { TaskService } from '../../Services/task.service';
import {
  createTask,
  createTaskFailure,
  createTaskSuccess,
  deleteTask,
  deleteTaskFailure,
  deleteTaskSuccess,
  loadTask,
  loadTaskFailure,
  loadTaskSuccess,
  loadTasks,
  loadTasksFailure,
  loadTasksSuccess,
  moveTask,
  moveTaskFailure,
  moveTaskSuccess,
  updateTask,
  updateTaskFailure,
  updateTaskSuccess,
} from './task.actions';

@Injectable()
export class TaskEffects {
  private readonly actions$ = inject(Actions);
  private readonly taskService = inject(TaskService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasks),
      mergeMap(({ columnId }) =>
        from(this.taskService.getTasks(columnId)).pipe(
          map((tasks) => loadTasksSuccess({ tasks, columnId })),
          catchError((error) => of(loadTasksFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  loadTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTask),
      switchMap(({ id }) =>
        from(this.taskService.getTask(id)).pipe(
          map((task) => loadTaskSuccess({ task })),
          catchError((error) => of(loadTaskFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createTask),
      mergeMap(({ payload }) =>
        from(this.taskService.createTask(payload)).pipe(
          map((task) => createTaskSuccess({ task })),
          catchError((error) => of(createTaskFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateTask),
      mergeMap(({ id, payload }) =>
        from(this.taskService.updateTask(id, payload)).pipe(
          map((task) => updateTaskSuccess({ task })),
          catchError((error) => of(updateTaskFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteTask),
      mergeMap(({ id }) =>
        from(this.taskService.deleteTask(id)).pipe(
          map(() => deleteTaskSuccess({ id })),
          catchError((error) => of(deleteTaskFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  moveTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(moveTask),
      mergeMap(({ id, columnId }) =>
        from(this.taskService.moveTask(id, columnId)).pipe(
          map((task) => moveTaskSuccess({ task })),
          catchError((error) => of(moveTaskFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
