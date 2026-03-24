import { createReducer, on } from '@ngrx/store';
import { getTask, getTaskSuccess,getTaskFailure } from './board.actions';
import { Task } from '../../core/interface';

export interface TaskStatus {
    task: Task | null;
    loading: boolean;
    error: string | null;
  }
  
  export const initialState: TaskStatus = {
    task: null,
    loading: false,
    error: null,
  };

  export const boardReducer = createReducer(
    initialState,
    on(getTask, (state) => ({ ...state, loading: true, error: null })),
    on(getTaskSuccess, (state, { task }) => ({ ...state, task, loading: false })),
    on(getTaskFailure, (state, { error }) => ({ ...state, error, loading: false })),
  );