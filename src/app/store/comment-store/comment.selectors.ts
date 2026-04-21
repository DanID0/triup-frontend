import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CommentState } from './comment.reducers';

export const selectCommentState = createFeatureSelector<CommentState>('comments');

export const selectAllComments = createSelector(selectCommentState, (s) => s.comments);

export const selectCommentsLoading = createSelector(selectCommentState, (s) => s.loading);

export const selectCommentsByTask = (taskId: string) =>
  createSelector(selectAllComments, (comments) =>
    comments
      .filter((c) => c.taskId === taskId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  );
