import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { WorkspaceService } from '../../Services/workspace.service';
import {
  createWorkspace,
  createWorkspaceFailure,
  createWorkspaceSuccess,
  deleteWorkspace,
  deleteWorkspaceFailure,
  deleteWorkspaceSuccess,
  loadWorkspace,
  loadWorkspaceFailure,
  loadWorkspaceSuccess,
  loadWorkspaces,
  loadWorkspacesFailure,
  loadWorkspacesSuccess,
  updateWorkspace,
  updateWorkspaceFailure,
  updateWorkspaceSuccess,
} from './workspace.actions';

@Injectable()
export class WorkspaceEffects {
  private readonly actions$ = inject(Actions);
  private readonly workspaceService = inject(WorkspaceService);

  loadWorkspaces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWorkspaces),
      switchMap(() =>
        from(this.workspaceService.getWorkspaces()).pipe(
          map((workspaces) => loadWorkspacesSuccess({ workspaces })),
          catchError((error) => of(loadWorkspacesFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  loadWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWorkspace),
      switchMap(({ id }) =>
        from(this.workspaceService.getWorkspace(id)).pipe(
          map((workspace) => loadWorkspaceSuccess({ workspace })),
          catchError((error) => of(loadWorkspaceFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  createWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createWorkspace),
      mergeMap(({ payload }) =>
        from(this.workspaceService.createWorkspace(payload)).pipe(
          map((workspace) => createWorkspaceSuccess({ workspace })),
          catchError((error) => of(createWorkspaceFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  updateWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateWorkspace),
      mergeMap(({ id, payload }) =>
        from(this.workspaceService.updateWorkspace(id, payload)).pipe(
          map((workspace) => updateWorkspaceSuccess({ workspace })),
          catchError((error) => of(updateWorkspaceFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  deleteWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteWorkspace),
      mergeMap(({ id }) =>
        from(this.workspaceService.deleteWorkspace(id)).pipe(
          map(() => deleteWorkspaceSuccess({ id })),
          catchError((error) => of(deleteWorkspaceFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
