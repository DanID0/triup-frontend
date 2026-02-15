import { createReducer, on } from '@ngrx/store';
import { getUser, getUserSuccess, getUserFailure, logOutSuccess, updateUser } from './user.actions';
import { User } from '../../core/interface';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

export const userReducer = createReducer(
  initialState,
  on(getUser, (state) => ({ ...state, loading: true, error: null })),
  on(getUserSuccess, (state, { user }) => ({ ...state, user, loading: false })),
  on(getUserFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(logOutSuccess, (state) => ({ ...state, user: null, loading: false })),
  on(updateUser, (state, { user }) => ({ ...state, user, loading: false })),
);
