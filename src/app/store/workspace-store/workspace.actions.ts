import { createAction, props } from '@ngrx/store';
import { Workspace } from '../../core/interface';
import {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from '../../Services/workspace.service';

export const loadWorkspaces = createAction('[Workspace] Load Workspaces');
export const loadWorkspacesSuccess = createAction(
  '[Workspace] Load Workspaces Success',
  props<{ workspaces: Workspace[] }>(),
);
export const loadWorkspacesFailure = createAction(
  '[Workspace] Load Workspaces Failure',
  props<{ error: string }>(),
);

export const loadWorkspace = createAction(
  '[Workspace] Load Workspace',
  props<{ id: string }>(),
);
export const loadWorkspaceSuccess = createAction(
  '[Workspace] Load Workspace Success',
  props<{ workspace: Workspace }>(),
);
export const loadWorkspaceFailure = createAction(
  '[Workspace] Load Workspace Failure',
  props<{ error: string }>(),
);

export const createWorkspace = createAction(
  '[Workspace] Create Workspace',
  props<{ payload: CreateWorkspacePayload }>(),
);
export const createWorkspaceSuccess = createAction(
  '[Workspace] Create Workspace Success',
  props<{ workspace: Workspace }>(),
);
export const createWorkspaceFailure = createAction(
  '[Workspace] Create Workspace Failure',
  props<{ error: string }>(),
);

export const updateWorkspace = createAction(
  '[Workspace] Update Workspace',
  props<{ id: string; payload: UpdateWorkspacePayload }>(),
);
export const updateWorkspaceSuccess = createAction(
  '[Workspace] Update Workspace Success',
  props<{ workspace: Workspace }>(),
);
export const updateWorkspaceFailure = createAction(
  '[Workspace] Update Workspace Failure',
  props<{ error: string }>(),
);

export const deleteWorkspace = createAction(
  '[Workspace] Delete Workspace',
  props<{ id: string }>(),
);
export const deleteWorkspaceSuccess = createAction(
  '[Workspace] Delete Workspace Success',
  props<{ id: string }>(),
);
export const deleteWorkspaceFailure = createAction(
  '[Workspace] Delete Workspace Failure',
  props<{ error: string }>(),
);

export const selectWorkspace = createAction(
  '[Workspace] Select Workspace',
  props<{ id: string | null }>(),
);

export const clearWorkspaces = createAction('[Workspace] Clear Workspaces');
