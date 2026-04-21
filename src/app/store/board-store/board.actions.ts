import { createAction, props } from '@ngrx/store';
import { Board } from '../../core/interface';

export const loadBoards = createAction(
  '[Board] Load Boards',
  props<{ workspaceId: string }>(),
);
export const loadBoardsSuccess = createAction(
  '[Board] Load Boards Success',
  props<{ boards: Board[] }>(),
);
export const loadBoardsFailure = createAction(
  '[Board] Load Boards Failure',
  props<{ error: string }>(),
);

export const loadBoard = createAction('[Board] Load Board', props<{ id: string }>());
export const loadBoardSuccess = createAction(
  '[Board] Load Board Success',
  props<{ board: Board }>(),
);
export const loadBoardFailure = createAction(
  '[Board] Load Board Failure',
  props<{ error: string }>(),
);

export const createBoard = createAction(
  '[Board] Create Board',
  props<{ payload: { workspaceId: string; name: string } }>(),
);
export const createBoardSuccess = createAction(
  '[Board] Create Board Success',
  props<{ board: Board }>(),
);
export const createBoardFailure = createAction(
  '[Board] Create Board Failure',
  props<{ error: string }>(),
);

export const updateBoard = createAction(
  '[Board] Update Board',
  props<{ id: string; payload: { name?: string } }>(),
);
export const updateBoardSuccess = createAction(
  '[Board] Update Board Success',
  props<{ board: Board }>(),
);
export const updateBoardFailure = createAction(
  '[Board] Update Board Failure',
  props<{ error: string }>(),
);

export const deleteBoard = createAction('[Board] Delete Board', props<{ id: string }>());
export const deleteBoardSuccess = createAction(
  '[Board] Delete Board Success',
  props<{ id: string }>(),
);
export const deleteBoardFailure = createAction(
  '[Board] Delete Board Failure',
  props<{ error: string }>(),
);

export const selectBoard = createAction(
  '[Board] Select Board',
  props<{ id: string | null }>(),
);

export const clearBoards = createAction('[Board] Clear Boards');
