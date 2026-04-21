import { createReducer, on } from '@ngrx/store';
import { Workspace } from '../../core/interface';
import {
  clearWorkspaces,
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
  selectWorkspace,
  updateWorkspace,
  updateWorkspaceFailure,
  updateWorkspaceSuccess,
} from './workspace.actions';

export interface WorkspaceState {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialWorkspaceState: WorkspaceState = {
  workspaces: [],
  selectedWorkspaceId: null,
  loading: false,
  error: null,
};

const upsert = (list: Workspace[], item: Workspace): Workspace[] => {
  const idx = list.findIndex((w) => w.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
};

export const workspaceReducer = createReducer(
  initialWorkspaceState,

  on(
    loadWorkspaces,
    loadWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    (state) => ({ ...state, loading: true, error: null }),
  ),

  on(loadWorkspacesSuccess, (state, { workspaces }) => ({
    ...state,
    workspaces,
    loading: false,
  })),
  on(loadWorkspacesFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(loadWorkspaceSuccess, (state, { workspace }) => ({
    ...state,
    workspaces: upsert(state.workspaces, workspace),
    loading: false,
  })),
  on(loadWorkspaceFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(createWorkspaceSuccess, (state, { workspace }) => ({
    ...state,
    workspaces: [...state.workspaces, workspace],
    loading: false,
  })),
  on(createWorkspaceFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(updateWorkspaceSuccess, (state, { workspace }) => ({
    ...state,
    workspaces: upsert(state.workspaces, workspace),
    loading: false,
  })),
  on(updateWorkspaceFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(deleteWorkspaceSuccess, (state, { id }) => ({
    ...state,
    workspaces: state.workspaces.filter((w) => w.id !== id),
    selectedWorkspaceId:
      state.selectedWorkspaceId === id ? null : state.selectedWorkspaceId,
    loading: false,
  })),
  on(deleteWorkspaceFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(selectWorkspace, (state, { id }) => ({ ...state, selectedWorkspaceId: id })),

  on(clearWorkspaces, () => initialWorkspaceState),
);
