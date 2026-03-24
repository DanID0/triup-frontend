import { createSelector, createFeatureSelector } from '@ngrx/store';
import { TaskStatus } from './board.reducers';
export const selectUserState = createFeatureSelector<TaskStatus>('user');

export const selectUser = createSelector(selectUserState, (state) => state.task);

export const selectUserLoading = createSelector(selectUserState, (state) => state.loading);

export const selectUserError = createSelector(selectUserState, (state) => state.error);
