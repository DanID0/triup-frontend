import { createReducer, on } from '@ngrx/store';
import { Board } from '../../core/interface';
import {
  clearBoards,
  createBoard,
  createBoardFailure,
  createBoardSuccess,
  deleteBoard,
  deleteBoardFailure,
  deleteBoardSuccess,
  loadBoard,
  loadBoardFailure,
  loadBoardSuccess,
  loadBoards,
  loadBoardsFailure,
  loadBoardsSuccess,
  selectBoard,
  updateBoard,
  updateBoardFailure,
  updateBoardSuccess,
} from './board.actions';

export interface BoardState {
  boards: Board[];
  selectedBoardId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialBoardState: BoardState = {
  boards: [],
  selectedBoardId: null,
  loading: false,
  error: null,
};

const upsert = (list: Board[], item: Board): Board[] => {
  const idx = list.findIndex((b) => b.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
};

export const boardReducer = createReducer(
  initialBoardState,

  on(loadBoards, loadBoard, createBoard, updateBoard, deleteBoard, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loadBoardsSuccess, (state, { boards }) => ({ ...state, boards, loading: false })),
  on(loadBoardsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(loadBoardSuccess, (state, { board }) => ({
    ...state,
    boards: upsert(state.boards, board),
    loading: false,
  })),
  on(loadBoardFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(createBoardSuccess, (state, { board }) => ({
    ...state,
    boards: [...state.boards, board],
    loading: false,
  })),
  on(createBoardFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(updateBoardSuccess, (state, { board }) => ({
    ...state,
    boards: upsert(state.boards, board),
    loading: false,
  })),
  on(updateBoardFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(deleteBoardSuccess, (state, { id }) => ({
    ...state,
    boards: state.boards.filter((b) => b.id !== id),
    selectedBoardId: state.selectedBoardId === id ? null : state.selectedBoardId,
    loading: false,
  })),
  on(deleteBoardFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(selectBoard, (state, { id }) => ({ ...state, selectedBoardId: id })),

  on(clearBoards, () => initialBoardState),
);
