import { createReducer, on } from '@ngrx/store';
import { Comment } from '../../core/interface';
import {
  clearComments,
  createComment,
  createCommentFailure,
  createCommentSuccess,
  deleteComment,
  deleteCommentFailure,
  deleteCommentSuccess,
  loadComments,
  loadCommentsFailure,
  loadCommentsSuccess,
} from './comment.actions';

export interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export const initialCommentState: CommentState = {
  comments: [],
  loading: false,
  error: null,
};

export const commentReducer = createReducer(
  initialCommentState,

  on(loadComments, createComment, deleteComment, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loadCommentsSuccess, (state, { taskId, comments }) => {
    const others = state.comments.filter((c) => c.taskId !== taskId);
    return { ...state, comments: [...others, ...comments], loading: false };
  }),
  on(loadCommentsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(createCommentSuccess, (state, { comment }) => ({
    ...state,
    comments: [...state.comments, comment],
    loading: false,
  })),
  on(createCommentFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(deleteCommentSuccess, (state, { id }) => ({
    ...state,
    comments: state.comments.filter((c) => c.id !== id),
    loading: false,
  })),
  on(deleteCommentFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(clearComments, () => initialCommentState),
);
