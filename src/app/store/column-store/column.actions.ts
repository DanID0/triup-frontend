import { createAction, props } from '@ngrx/store';
import { Column } from '../../core/interface';
import {
  CreateColumnPayload,
  UpdateColumnPayload,
} from '../../Services/column.service';

export const loadColumns = createAction(
  '[Column] Load Columns',
  props<{ boardId?: string }>(),
);
export const loadColumnsSuccess = createAction(
  '[Column] Load Columns Success',
  props<{ columns: Column[] }>(),
);
export const loadColumnsFailure = createAction(
  '[Column] Load Columns Failure',
  props<{ error: string }>(),
);

export const loadColumn = createAction('[Column] Load Column', props<{ id: string }>());
export const loadColumnSuccess = createAction(
  '[Column] Load Column Success',
  props<{ column: Column }>(),
);
export const loadColumnFailure = createAction(
  '[Column] Load Column Failure',
  props<{ error: string }>(),
);

export const createColumn = createAction(
  '[Column] Create Column',
  props<{ payload: CreateColumnPayload }>(),
);
export const createColumnSuccess = createAction(
  '[Column] Create Column Success',
  props<{ column: Column }>(),
);
export const createColumnFailure = createAction(
  '[Column] Create Column Failure',
  props<{ error: string }>(),
);

export const updateColumn = createAction(
  '[Column] Update Column',
  props<{ id: string; payload: UpdateColumnPayload }>(),
);
export const updateColumnSuccess = createAction(
  '[Column] Update Column Success',
  props<{ column: Column }>(),
);
export const updateColumnFailure = createAction(
  '[Column] Update Column Failure',
  props<{ error: string }>(),
);

export const deleteColumn = createAction(
  '[Column] Delete Column',
  props<{ id: string }>(),
);
export const deleteColumnSuccess = createAction(
  '[Column] Delete Column Success',
  props<{ id: string }>(),
);
export const deleteColumnFailure = createAction(
  '[Column] Delete Column Failure',
  props<{ error: string }>(),
);

export const clearColumns = createAction('[Column] Clear Columns');
