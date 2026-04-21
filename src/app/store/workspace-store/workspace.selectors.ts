import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WorkspaceState } from './workspace.reducers';

export const selectWorkspaceState = createFeatureSelector<WorkspaceState>('workspaces');

export const selectAllWorkspaces = createSelector(
  selectWorkspaceState,
  (s) => s.workspaces,
);

export const selectWorkspacesLoading = createSelector(
  selectWorkspaceState,
  (s) => s.loading,
);

export const selectWorkspacesError = createSelector(selectWorkspaceState, (s) => s.error);

export const selectSelectedWorkspaceId = createSelector(
  selectWorkspaceState,
  (s) => s.selectedWorkspaceId,
);

export const selectSelectedWorkspace = createSelector(
  selectAllWorkspaces,
  selectSelectedWorkspaceId,
  (workspaces, id) => (id ? workspaces.find((w) => w.id === id) ?? null : null),
);

export const selectWorkspaceById = (id: string) =>
  createSelector(selectAllWorkspaces, (workspaces) =>
    workspaces.find((w) => w.id === id) ?? null,
  );
