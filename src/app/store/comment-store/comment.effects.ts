import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { CommentService } from '../../Services/comment.service';
import {
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

@Injectable()
export class CommentEffects {
  private readonly actions$ = inject(Actions);
  private readonly commentService = inject(CommentService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadComments),
      switchMap(({ taskId }) =>
        from(this.commentService.getByTask(taskId)).pipe(
          map((comments) => loadCommentsSuccess({ taskId, comments })),
          catchError((error) => of(loadCommentsFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createComment),
      mergeMap(({ payload }) =>
        from(this.commentService.create(payload)).pipe(
          map((comment) => createCommentSuccess({ comment })),
          catchError((error) => of(createCommentFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  remove$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteComment),
      mergeMap(({ id }) =>
        from(this.commentService.delete(id)).pipe(
          map(() => deleteCommentSuccess({ id })),
          catchError((error) => of(deleteCommentFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
