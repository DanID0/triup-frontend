import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { ColumnService } from '../../Services/column.service';
import {
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

@Injectable()
export class ColumnEffects {
  private readonly actions$ = inject(Actions);
  private readonly columnService = inject(ColumnService);

  loadColumns$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadColumns),
      switchMap(({ boardId }) =>
        from(this.columnService.getColumns(boardId)).pipe(
          map((columns) => loadColumnsSuccess({ columns })),
          catchError((error) => of(loadColumnsFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  loadColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadColumn),
      switchMap(({ id }) =>
        from(this.columnService.getColumn(id)).pipe(
          map((column) => loadColumnSuccess({ column })),
          catchError((error) => of(loadColumnFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  createColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createColumn),
      mergeMap(({ payload }) =>
        from(this.columnService.createColumn(payload)).pipe(
          map((column) => createColumnSuccess({ column })),
          catchError((error) => of(createColumnFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  updateColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateColumn),
      mergeMap(({ id, payload }) =>
        from(this.columnService.updateColumn(id, payload)).pipe(
          map((column) => updateColumnSuccess({ column })),
          catchError((error) => of(updateColumnFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  deleteColumn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteColumn),
      mergeMap(({ id }) =>
        from(this.columnService.deleteColumn(id)).pipe(
          map(() => deleteColumnSuccess({ id })),
          catchError((error) => of(deleteColumnFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
