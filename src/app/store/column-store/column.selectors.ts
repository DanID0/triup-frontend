import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ColumnState } from './column.reducers';

export const selectColumnState = createFeatureSelector<ColumnState>('columns');

export const selectAllColumns = createSelector(selectColumnState, (s) => s.columns);

export const selectColumnsLoading = createSelector(selectColumnState, (s) => s.loading);

export const selectColumnsError = createSelector(selectColumnState, (s) => s.error);

export const selectColumnById = (id: string) =>
  createSelector(selectAllColumns, (columns) =>
    columns.find((c) => c.id === id) ?? null,
  );

export const selectColumnsByBoard = (boardId: string) =>
  createSelector(selectAllColumns, (columns) =>
    [...columns]
      .filter((c) => c.boardId === boardId)
      .sort((a, b) => Number(a.position) - Number(b.position)),
  );
