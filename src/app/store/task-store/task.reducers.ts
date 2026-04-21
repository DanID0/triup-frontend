import { createReducer, on } from '@ngrx/store';
import { Task } from '../../core/interface';
import {
  clearTasks,
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
  selectTask,
  updateTask,
  updateTaskFailure,
  updateTaskSuccess,
} from './task.actions';

export interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialTaskState: TaskState = {
  tasks: [],
  selectedTaskId: null,
  loading: false,
  error: null,
};

const upsertTask = (tasks: Task[], task: Task): Task[] => {
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx === -1) return [...tasks, task];
  const next = [...tasks];
  next[idx] = task;
  return next;
};

export const taskReducer = createReducer(
  initialTaskState,

  on(loadTasks, loadTask, createTask, updateTask, deleteTask, moveTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
  })),
  on(loadTasksFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(loadTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: upsertTask(state.tasks, task),
    loading: false,
  })),
  on(loadTaskFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    loading: false,
  })),
  on(createTaskFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(updateTaskSuccess, moveTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: upsertTask(state.tasks, task),
    loading: false,
  })),
  on(updateTaskFailure, moveTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(deleteTaskSuccess, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    loading: false,
  })),
  on(deleteTaskFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(selectTask, (state, { id }) => ({ ...state, selectedTaskId: id })),

  on(clearTasks, () => initialTaskState),
);
