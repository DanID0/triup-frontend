import { createAction, props } from '@ngrx/store';
import { Board, Task, Column, UserBoard } from '../../core/interface';


export const getTask = createAction('[Task] Get Task');
export const getTaskSuccess = createAction('[Task] Get Task Success', props<{ task: Task }>());
export const getTaskFailure = createAction('[Task] Get Task Failure', props<{ error: string }>());
