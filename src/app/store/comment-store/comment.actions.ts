import { createAction, props } from '@ngrx/store';
import { Comment } from '../../core/interface';

export const loadComments = createAction(
  '[Comment] Load Comments',
  props<{ taskId: string }>(),
);
export const loadCommentsSuccess = createAction(
  '[Comment] Load Comments Success',
  props<{ taskId: string; comments: Comment[] }>(),
);
export const loadCommentsFailure = createAction(
  '[Comment] Load Comments Failure',
  props<{ error: string }>(),
);

export const createComment = createAction(
  '[Comment] Create Comment',
  props<{ payload: { taskId: string; content: string } }>(),
);
export const createCommentSuccess = createAction(
  '[Comment] Create Comment Success',
  props<{ comment: Comment }>(),
);
export const createCommentFailure = createAction(
  '[Comment] Create Comment Failure',
  props<{ error: string }>(),
);

export const deleteComment = createAction(
  '[Comment] Delete Comment',
  props<{ id: string }>(),
);
export const deleteCommentSuccess = createAction(
  '[Comment] Delete Comment Success',
  props<{ id: string }>(),
);
export const deleteCommentFailure = createAction(
  '[Comment] Delete Comment Failure',
  props<{ error: string }>(),
);

export const clearComments = createAction('[Comment] Clear');
