import { createReducer, on } from '@ngrx/store';
import { Column } from '../../core/interface';
import {
  clearColumns,
  createColumn,
  createColumnFailure,
  createColumnSuccess,
  deleteColumn,
  deleteColumnFailure,
  deleteColumnSuccess,
  loadColumn,
  loadColumnFailure,
  loadColumnSuccess,
  loadColumns,
  loadColumnsFailure,
  loadColumnsSuccess,
  updateColumn,
  updateColumnFailure,
  updateColumnSuccess,
} from './column.actions';

export interface ColumnState {
  columns: Column[];
  loading: boolean;
  error: string | null;
}

export const initialColumnState: ColumnState = {
  columns: [],
  loading: false,
  error: null,
};

const upsert = (list: Column[], item: Column): Column[] => {
  const idx = list.findIndex((c) => c.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
};

export const columnReducer = createReducer(
  initialColumnState,

  on(loadColumns, loadColumn, createColumn, updateColumn, deleteColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loadColumnsSuccess, (state, { columns }) => ({ ...state, columns, loading: false })),
  on(loadColumnsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(loadColumnSuccess, (state, { column }) => ({
    ...state,
    columns: upsert(state.columns, column),
    loading: false,
  })),
  on(loadColumnFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(createColumnSuccess, (state, { column }) => ({
    ...state,
    columns: [...state.columns, column],
    loading: false,
  })),
  on(createColumnFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(updateColumnSuccess, (state, { column }) => ({
    ...state,
    columns: upsert(state.columns, column),
    loading: false,
  })),
  on(updateColumnFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(deleteColumnSuccess, (state, { id }) => ({
    ...state,
    columns: state.columns.filter((c) => c.id !== id),
    loading: false,
  })),
  on(deleteColumnFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(clearColumns, () => initialColumnState),
);
