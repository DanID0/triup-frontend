import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducers';

export const selectBoardState = createFeatureSelector<BoardState>('boards');

export const selectAllBoards = createSelector(selectBoardState, (s) => s.boards);

export const selectBoardsLoading = createSelector(selectBoardState, (s) => s.loading);

export const selectBoardsError = createSelector(selectBoardState, (s) => s.error);

export const selectSelectedBoardId = createSelector(
  selectBoardState,
  (s) => s.selectedBoardId,
);

export const selectSelectedBoard = createSelector(
  selectAllBoards,
  selectSelectedBoardId,
  (boards, id) => (id ? boards.find((b) => b.id === id) ?? null : null),
);

export const selectBoardById = (id: string) =>
  createSelector(selectAllBoards, (boards) => boards.find((b) => b.id === id) ?? null);

export const selectBoardsByWorkspace = (workspaceId: string) =>
  createSelector(selectAllBoards, (boards) =>
    boards.filter((b) => b.workspaceId === workspaceId),
  );
