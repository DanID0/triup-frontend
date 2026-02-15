import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState } from './user.reducers';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectUser = createSelector(selectUserState, (state) => state.user);

export const selectUserLoading = createSelector(selectUserState, (state) => state.loading);

export const selectUserError = createSelector(selectUserState, (state) => state.error);
