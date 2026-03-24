import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { BoardService } from '../../Services/board.service';
import { getTask, getTaskSuccess,getTaskFailure } from './board.actions';

@Injectable()
export class BoardEffects {
  private actions$ = inject(Actions);
  private boardService = inject(BoardService);

  getTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getTask),
      switchMap(() =>
        from(this.boardService.getTask()).pipe(
          map((task) => getTaskSuccess({ task })),
          catchError((error) => of(getTaskFailure({ error: error.message })))
        )
      )
    )
  );

}