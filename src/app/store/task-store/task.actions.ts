import { createAction, props } from '@ngrx/store';
import { Task } from '../../core/interface';
import { CreateTaskPayload, UpdateTaskPayload } from '../../Services/task.service';

export const loadTasks = createAction(
  '[Task] Load Tasks',
  props<{ columnId?: string }>(),
);
export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: Task[]; columnId?: string }>(),
);
export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: string }>(),
);

export const loadTask = createAction('[Task] Load Task', props<{ id: string }>());
export const loadTaskSuccess = createAction(
  '[Task] Load Task Success',
  props<{ task: Task }>(),
);
export const loadTaskFailure = createAction(
  '[Task] Load Task Failure',
  props<{ error: string }>(),
);

export const createTask = createAction(
  '[Task] Create Task',
  props<{ payload: CreateTaskPayload }>(),
);
export const createTaskSuccess = createAction(
  '[Task] Create Task Success',
  props<{ task: Task }>(),
);
export const createTaskFailure = createAction(
  '[Task] Create Task Failure',
  props<{ error: string }>(),
);

export const updateTask = createAction(
  '[Task] Update Task',
  props<{ id: string; payload: UpdateTaskPayload }>(),
);
export const updateTaskSuccess = createAction(
  '[Task] Update Task Success',
  props<{ task: Task }>(),
);
export const updateTaskFailure = createAction(
  '[Task] Update Task Failure',
  props<{ error: string }>(),
);

export const deleteTask = createAction('[Task] Delete Task', props<{ id: string }>());
export const deleteTaskSuccess = createAction(
  '[Task] Delete Task Success',
  props<{ id: string }>(),
);
export const deleteTaskFailure = createAction(
  '[Task] Delete Task Failure',
  props<{ error: string }>(),
);

export const moveTask = createAction(
  '[Task] Move Task',
  props<{ id: string; columnId: string }>(),
);
export const moveTaskSuccess = createAction(
  '[Task] Move Task Success',
  props<{ task: Task }>(),
);
export const moveTaskFailure = createAction(
  '[Task] Move Task Failure',
  props<{ error: string }>(),
);

export const selectTask = createAction(
  '[Task] Select Task',
  props<{ id: string | null }>(),
);

export const clearTasks = createAction('[Task] Clear Tasks');
