import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState } from './task.reducers';

export const selectTaskState = createFeatureSelector<TaskState>('tasks');

export const selectAllTasks = createSelector(selectTaskState, (s) => s.tasks);

export const selectTasksLoading = createSelector(selectTaskState, (s) => s.loading);

export const selectTasksError = createSelector(selectTaskState, (s) => s.error);

export const selectSelectedTaskId = createSelector(selectTaskState, (s) => s.selectedTaskId);

export const selectSelectedTask = createSelector(
  selectAllTasks,
  selectSelectedTaskId,
  (tasks, id) => (id ? tasks.find((t) => t.id === id) ?? null : null),
);

export const selectTaskById = (id: string) =>
  createSelector(selectAllTasks, (tasks) => tasks.find((t) => t.id === id) ?? null);

export const selectTasksByColumn = (columnId: string) =>
  createSelector(selectAllTasks, (tasks) => tasks.filter((t) => t.columnId === columnId));

export const selectTasksByAssignee = (assigneeId: string) =>
  createSelector(selectAllTasks, (tasks) => tasks.filter((t) => t.assigneeId === assigneeId));
