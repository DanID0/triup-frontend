import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { BoardService } from '../../Services/board.service';
import {
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
  updateBoard,
  updateBoardFailure,
  updateBoardSuccess,
} from './board.actions';

@Injectable()
export class BoardEffects {
  private readonly actions$ = inject(Actions);
  private readonly boardService = inject(BoardService);

  loadBoards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBoards),
      switchMap(({ workspaceId }) =>
        from(this.boardService.getBoardsByWorkspace(workspaceId)).pipe(
          map((boards) => loadBoardsSuccess({ boards })),
          catchError((error) => of(loadBoardsFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  loadBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBoard),
      switchMap(({ id }) =>
        from(this.boardService.getBoard(id)).pipe(
          map((board) => loadBoardSuccess({ board })),
          catchError((error) => of(loadBoardFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  createBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createBoard),
      mergeMap(({ payload }) =>
        from(this.boardService.createBoard(payload)).pipe(
          map((board) => createBoardSuccess({ board })),
          catchError((error) => of(createBoardFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  updateBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateBoard),
      mergeMap(({ id, payload }) =>
        from(this.boardService.updateBoard(id, payload)).pipe(
          map((board) => updateBoardSuccess({ board })),
          catchError((error) => of(updateBoardFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  deleteBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteBoard),
      mergeMap(({ id }) =>
        from(this.boardService.deleteBoard(id)).pipe(
          map(() => deleteBoardSuccess({ id })),
          catchError((error) => of(deleteBoardFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
