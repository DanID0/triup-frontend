import { createAction, props } from '@ngrx/store';
import { User } from '../../core/interface';

export const getUser = createAction('[User] Get User');
export const getUserSuccess = createAction('[User] Get User Success', props<{ user: User }>());
export const getUserFailure = createAction('[User] Get User Failure', props<{ error: string }>());

export const logOut = createAction('[User] Log Out');
export const logOutSuccess = createAction('[User] Log Out Success');

export const updateUser = createAction('[User] Update User', props<{ user: User }>());
