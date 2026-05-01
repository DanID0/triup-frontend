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
  deleteWorkspace,
  loadWorkspaces,
  updateWorkspace,
} from '../../../store/workspace-store/workspace.actions';

import { selectAllBoards } from '../../../store/board-store/board.selectors';
import { createBoard, loadBoards } from '../../../store/board-store/board.actions';
import { combineLatest } from 'rxjs';
import { UploadService } from '../../../Services/upload.service';
import { I18nService } from '../../../Services/i18n.service';
import { I18nPipe } from '../../../core/i18n.pipe';
import { ThemeService } from '../../../Services/theme.service';

type CreateModalMode = null | 'board' | 'workspace';
type SidebarTab = 'boards' | 'settings';

const RECENT_BOARDS_KEY_PREFIX = 'triup:recentBoards:';
const STARRED_BOARDS_KEY_PREFIX = 'triup:starredBoards:';
const HIDDEN_WORKSPACES_KEY_PREFIX = 'triup:hiddenWorkspaces:';
const RECENT_BOARDS_LIMIT = 5;

@Component({
  selector: 'app-workboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, I18nPipe],
  templateUrl: './workboard.html',
  styleUrl: './workboard.css',
})
export class Workboard implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploads = inject(UploadService);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);

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
    return this.allBoards().filter((b) => {
      const wsName = this.workspaceById(b.workspaceId)?.name ?? b.workspace?.name ?? '';
      return b.name.toLowerCase().includes(q) || wsName.toLowerCase().includes(q);
    });
  });

  readonly recentBoards = signal<Board[]>([]);
  readonly starredBoards = signal<Board[]>([]);
  readonly selectedWorkspaceId = signal<string | null>(null);
  readonly hiddenWorkspaceIds = signal<string[]>([]);
  readonly activeTab = signal<SidebarTab>('boards');

  readonly visibleOwnedWorkspaces = computed(() => {
    const selected = this.selectedWorkspaceId();
    return this.ownedWorkspaces().filter((ws) => {
      if (selected && ws.id !== selected) return false;
      return true;
    });
  });

  readonly visibleGuestWorkspaces = computed(() => {
    const selected = this.selectedWorkspaceId();
    return this.guestWorkspaces().filter((ws) => {
      if (selected && ws.id !== selected) return false;
      return true;
    });
  });

  readonly createModal = signal<CreateModalMode>(null);
  readonly accountModalOpen = signal(false);
  newBoardName = '';
  newBoardWorkspaceId = '';
  newWorkspaceName = '';
  newWorkspaceAccess: 'Public' | 'Privates' = 'Public';
  settingsWorkspaceId = '';
  settingsWorkspaceAccess: 'Public' | 'Privates' = 'Public';
  readonly pendingWorkspaceDelete = signal<Workspace | null>(null);

  ngOnInit(): void {
    this.store.dispatch(loadWorkspaces());

    this.store
      .select(selectAllWorkspaces)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
        for (const w of list) {
          this.store.dispatch(loadBoards({ workspaceId: w.id }));
        }
        if (!this.settingsWorkspaceId) {
          const owned = list.filter((w) => w.userId === this.user()?.id);
          if (owned.length) {
            this.settingsWorkspaceId = owned[0].id;
            this.settingsWorkspaceAccess = owned[0].accessType;
          }
        } else {
          const existing = list.find((w) => w.id === this.settingsWorkspaceId);
          if (existing) this.settingsWorkspaceAccess = existing.accessType;
        }
      });

    combineLatest([this.store.select(selectUser), this.store.select(selectAllBoards)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([user, boards]) => {
        if (!user?.id) {
          this.recentBoards.set([]);
          this.starredBoards.set([]);
          this.i18n.setFromInterfaceLanguage(null);
          return;
        }
        this.i18n.setFromInterfaceLanguage(user.interfaceLanguage);
        this.hydratePersistedBoardLists(user.id, boards);
      });
  }

  private recentBoardsKey(userId: string): string {
    return `${RECENT_BOARDS_KEY_PREFIX}${userId}`;
  }

  private hiddenWorkspacesKey(userId: string): string {
    return `${HIDDEN_WORKSPACES_KEY_PREFIX}${userId}`;
  }

  private hydratePersistedBoardLists(userId: string, boards: Board[]): void {
    const byId = (id: string) => boards.find((b) => b.id === id);
    try {
      const recentRaw = localStorage.getItem(this.recentBoardsKey(userId));
      const recentStored: Board[] = recentRaw ? (JSON.parse(recentRaw) as Board[]) : [];
      const trimmed = recentStored.slice(0, RECENT_BOARDS_LIMIT);
      this.recentBoards.set(trimmed.map((r) => byId(r.id) ?? r));
      localStorage.setItem(this.recentBoardsKey(userId), JSON.stringify(trimmed));
    } catch {
      this.recentBoards.set([]);
    }
    try {
      const order: string[] = JSON.parse(
        localStorage.getItem(`${STARRED_BOARDS_KEY_PREFIX}${userId}`) || '[]',
      );
      const list = order.map((id) => byId(id)).filter((b): b is Board => !!b);
      this.starredBoards.set(list);
    } catch {
      this.starredBoards.set([]);
    }
    try {
      const hidden: string[] = JSON.parse(
        localStorage.getItem(this.hiddenWorkspacesKey(userId)) || '[]',
      );
      this.hiddenWorkspaceIds.set(hidden);
    } catch {
      this.hiddenWorkspaceIds.set([]);
    }
  }

  boardsFor(workspaceId: string): Board[] {
    return this.allBoards().filter((b) => b.workspaceId === workspaceId);
  }

  creatorName(workspace: Workspace | undefined): string {
    if (!workspace) return '—';
    if (workspace.user?.username) return workspace.user.username;
    return workspace.userId === this.user()?.id ? (this.user()?.username ?? 'You') : '—';
  }

  creatorAvatarUrl(workspace: Workspace | undefined): string {
    if (!workspace) return '';
    const u = workspace.user;
    if (u?.avatarUrl) return this.uploads.absoluteUrl(u.avatarUrl);
    if (workspace.userId === this.user()?.id) return this.userAvatarUrl();
    return '';
  }

  creatorInitial(workspace: Workspace | undefined): string {
    const name = this.creatorName(workspace);
    if (name === '—') return '?';
    return name.charAt(0).toUpperCase();
  }

  workspaceById(id: string): Workspace | undefined {
    return this.workspaces().find((w) => w.id === id);
  }

  /** Sidebar: jump to that workspace’s board list and refresh boards. */
  goToWorkspaceOnMain(workspaceId: string): void {
    this.activeTab.set('boards');
    this.selectedWorkspaceId.set(workspaceId);
    this.hiddenWorkspaceIds.update((ids) => ids.filter((id) => id !== workspaceId));
    const uid = this.user()?.id;
    if (uid) {
      localStorage.setItem(
        this.hiddenWorkspacesKey(uid),
        JSON.stringify(this.hiddenWorkspaceIds()),
      );
    }
    this.store.dispatch(loadBoards({ workspaceId }));
    queueMicrotask(() => {
      document
        .getElementById(`workboard-ws-${workspaceId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  selectAllBoardsTab(): void {
    this.activeTab.set('boards');
    this.selectedWorkspaceId.set(null);
  }

  clearWorkspaceFilter(): void {
    this.selectedWorkspaceId.set(null);
  }

  isWorkspaceHidden(id: string): boolean {
    return this.hiddenWorkspaceIds().includes(id);
  }

  toggleWorkspaceHidden(id: string): void {
    this.hiddenWorkspaceIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    const uid = this.user()?.id;
    if (uid) {
      localStorage.setItem(
        this.hiddenWorkspacesKey(uid),
        JSON.stringify(this.hiddenWorkspaceIds()),
      );
    }
  }

  /** Section context, loaded workspaces list, or workspace embedded on the board (e.g. from loadBoard). */
  workspaceForBoard(board: Board, sectionWorkspace?: Workspace): Workspace | undefined {
    return sectionWorkspace || this.workspaceById(board.workspaceId) || board.workspace;
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

  toggleAccountModal(): void {
    this.accountModalOpen.set(!this.accountModalOpen());
  }

  openManageAccount(): void {
    this.accountModalOpen.set(false);
    this.router.navigateByUrl('/settings/manage-profile');
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
    const userId = this.user()?.id;
    if (!userId) {
      this.router.navigate(['/board'], { queryParams: { id: board.id } });
      return;
    }
    const merged = this.allBoards().find((x) => x.id === board.id) ?? board;
    const updated = [merged, ...this.recentBoards().filter((b) => b.id !== board.id)].slice(
      0,
      RECENT_BOARDS_LIMIT,
    );
    this.recentBoards.set(updated);
    localStorage.setItem(this.recentBoardsKey(userId), JSON.stringify(updated));
    this.router.navigate(['/board'], { queryParams: { id: board.id } });
  }

  workspaceInitial(name: string): string {
    return (name?.trim()?.charAt(0) ?? '?').toUpperCase();
  }

  userAvatarUrl(): string {
    return this.uploads.absoluteUrl(this.user()?.avatarUrl);
  }

  onLogout(): void {
    this.accountModalOpen.set(false);
    this.store.dispatch(logOut());
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  onSettingsWorkspaceChange(workspaceId: string): void {
    this.settingsWorkspaceId = workspaceId;
    const ws = this.workspaceById(workspaceId);
    this.settingsWorkspaceAccess = ws?.accessType ?? 'Public';
  }

  saveWorkspaceVisibility(): void {
    if (!this.settingsWorkspaceId) return;
    this.store.dispatch(
      updateWorkspace({
        id: this.settingsWorkspaceId,
        payload: { accessType: this.settingsWorkspaceAccess },
      }),
    );
  }

  deleteSelectedWorkspace(): void {
    if (!this.settingsWorkspaceId) return;
    const ws = this.workspaceById(this.settingsWorkspaceId);
    if (!ws) return;
    this.pendingWorkspaceDelete.set(ws);
  }

  cancelWorkspaceDelete(): void {
    this.pendingWorkspaceDelete.set(null);
  }

  confirmWorkspaceDelete(): void {
    const ws = this.pendingWorkspaceDelete();
    if (!ws) return;
    this.pendingWorkspaceDelete.set(null);
    this.store.dispatch(deleteWorkspace({ id: ws.id }));
    this.settingsWorkspaceId = '';
  }

  trackById = (_: number, item: { id: string }) => item.id;
}
