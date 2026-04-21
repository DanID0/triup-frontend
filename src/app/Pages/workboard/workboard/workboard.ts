import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Board, User, Workspace } from '../../../core/interface';

import { logOut } from '../../../store/user-store/user.actions';
import { selectUser } from '../../../store/user-store/user.selectors';

import {
  selectAllWorkspaces,
  selectWorkspacesError,
  selectWorkspacesLoading,
} from '../../../store/workspace-store/workspace.selectors';
import {
  createWorkspace,
  loadWorkspaces,
} from '../../../store/workspace-store/workspace.actions';

import { selectAllBoards } from '../../../store/board-store/board.selectors';
import { createBoard, loadBoards } from '../../../store/board-store/board.actions';

type CreateModalMode = null | 'board' | 'workspace';
type SidebarTab = 'boards' | 'templates' | 'settings';

const RECENT_BOARDS_KEY = 'triup:recentBoards';
const RECENT_BOARDS_LIMIT = 5;

@Component({
  selector: 'app-workboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './workboard.html',
  styleUrl: './workboard.css',
})
export class Workboard implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = toSignal<User | null>(this.store.select(selectUser));
  readonly workspaces = toSignal(this.store.select(selectAllWorkspaces), {
    initialValue: [] as Workspace[],
  });
  readonly workspacesLoading = toSignal(this.store.select(selectWorkspacesLoading), {
    initialValue: false,
  });
  readonly workspacesError = toSignal(this.store.select(selectWorkspacesError), {
    initialValue: null,
  });
  readonly allBoards = toSignal(this.store.select(selectAllBoards), {
    initialValue: [] as Board[],
  });

  readonly ownedWorkspaces = computed(() => {
    const uid = this.user()?.id;
    if (!uid) return [];
    return this.workspaces().filter((w) => w.userId === uid);
  });

  readonly guestWorkspaces = computed(() => {
    const uid = this.user()?.id;
    if (!uid) return [];
    return this.workspaces().filter((w) => w.userId !== uid);
  });

  readonly searchQuery = signal('');
  readonly filteredBoards = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return null;
    return this.allBoards().filter((b) => b.name.toLowerCase().includes(q));
  });

  readonly recentBoards = signal<Board[]>([]);
  readonly activeTab = signal<SidebarTab>('boards');

  readonly createModal = signal<CreateModalMode>(null);
  newBoardName = '';
  newBoardWorkspaceId = '';
  newWorkspaceName = '';
  newWorkspaceAccess: 'Public' | 'Privates' = 'Public';

  ngOnInit(): void {
    this.store.dispatch(loadWorkspaces());

    this.store
      .select(selectAllWorkspaces)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
        for (const w of list) {
          this.store.dispatch(loadBoards({ workspaceId: w.id }));
        }
      });

    try {
      const raw = localStorage.getItem(RECENT_BOARDS_KEY);
      if (raw) this.recentBoards.set(JSON.parse(raw) as Board[]);
    } catch {
      this.recentBoards.set([]);
    }
  }

  boardsFor(workspaceId: string): Board[] {
    return this.allBoards().filter((b) => b.workspaceId === workspaceId);
  }

  creatorName(workspace: Workspace | undefined): string {
    if (!workspace) return '—';
    if (workspace.user?.username) return workspace.user.username;
    return workspace.userId === this.user()?.id ? this.user()?.username ?? 'You' : '—';
  }

  workspaceById(id: string): Workspace | undefined {
    return this.workspaces().find((w) => w.id === id);
  }

  openCreateBoard(): void {
    const owned = this.ownedWorkspaces();
    this.newBoardWorkspaceId = owned[0]?.id ?? '';
    this.newBoardName = '';
    this.createModal.set('board');
  }

  openCreateWorkspace(): void {
    this.newWorkspaceName = '';
    this.newWorkspaceAccess = 'Public';
    this.createModal.set('workspace');
  }

  closeModal(): void {
    this.createModal.set(null);
  }

  submitCreateBoard(): void {
    const name = this.newBoardName.trim();
    const workspaceId = this.newBoardWorkspaceId;
    if (!name || !workspaceId) return;
    this.store.dispatch(createBoard({ payload: { name, workspaceId } }));
    this.closeModal();
  }

  submitCreateWorkspace(): void {
    const name = this.newWorkspaceName.trim();
    if (!name) return;
    this.store.dispatch(
      createWorkspace({ payload: { name, accessType: this.newWorkspaceAccess } }),
    );
    this.closeModal();
  }

  openBoard(board: Board): void {
    const updated = [board, ...this.recentBoards().filter((b) => b.id !== board.id)].slice(
      0,
      RECENT_BOARDS_LIMIT,
    );
    this.recentBoards.set(updated);
    localStorage.setItem(RECENT_BOARDS_KEY, JSON.stringify(updated));
    this.router.navigate(['/board'], { queryParams: { id: board.id } });
  }

  workspaceInitial(name: string): string {
    return (name?.trim()?.charAt(0) ?? '?').toUpperCase();
  }

  onLogout(): void {
    this.store.dispatch(logOut());
  }

  trackById = (_: number, item: { id: string }) => item.id;
}
