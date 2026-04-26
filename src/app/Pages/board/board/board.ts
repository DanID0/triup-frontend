import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map, switchMap } from 'rxjs';

import {
  Board as BoardModel,
  BoardActivity,
  Column,
  InvitedUserRights,
  Priority,
  Task,
  User,
  UserBoard,
} from '../../../core/interface';
import { TaskComponent } from '../components/task/task';
import { TaskModalComponent } from '../components/task-modal/task-modal';
import { FilterPanelComponent, BoardFilter, emptyFilter } from '../components/filter-panel/filter-panel';
import { AssigneesPanelComponent } from '../components/assignees-panel/assignees-panel';
import { I18nPipe } from '../../../core/i18n.pipe';

import { loadBoard, updateBoard } from '../../../store/board-store/board.actions';
import { selectBoardById } from '../../../store/board-store/board.selectors';
import {
  createColumn,
  loadColumns,
  updateColumn,
  deleteColumn,
} from '../../../store/column-store/column.actions';
import { selectColumnsByBoard } from '../../../store/column-store/column.selectors';
import {
  createTask,
  deleteTask,
  loadTasks,
  moveTask,
  updateTask,
} from '../../../store/task-store/task.actions';
import { selectAllTasks } from '../../../store/task-store/task.selectors';
import { selectUser } from '../../../store/user-store/user.selectors';
import { logOut } from '../../../store/user-store/user.actions';

import { BoardMembersService } from '../../../Services/board-members.service';
import { UploadService } from '../../../Services/upload.service';
import { I18nService } from '../../../Services/i18n.service';
import { ThemeService } from '../../../Services/theme.service';
import { BoardService } from '../../../Services/board.service';

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

type TaskSortField = 'updatedAt' | 'dueDate' | 'name' | 'priority' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const COLUMN_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#ef4444',
  '#a855f7',
  '#06b6d4',
];

const RECENT_BOARDS_KEY_PREFIX = 'triup:recentBoards:';
const STARRED_BOARDS_KEY_PREFIX = 'triup:starredBoards:';
const RECENT_BOARDS_LIMIT = 5;
const PRIORITY_LABELS: Record<Priority, { text: string; color: string }> = {
  [Priority.High]: { text: 'urgent', color: '#ef4444' },
  [Priority.Medium]: { text: 'medium', color: '#eab308' },
  [Priority.Low]: { text: 'noRush', color: '#22c55e' },
};

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TaskComponent,
    TaskModalComponent,
    FilterPanelComponent,
    AssigneesPanelComponent,
    I18nPipe,
  ],
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
})
export class Board implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly membersService = inject(BoardMembersService);
  private readonly boardService = inject(BoardService);
  readonly uploads = inject(UploadService);
  private readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);

  @ViewChild('boardImageInput') boardImageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('boardNameInput') boardNameInput?: ElementRef<HTMLInputElement>;

  readonly boardId = signal<string | null>(null);
  readonly board = signal<BoardModel | null>(null);
  readonly columns = signal<ColumnWithTasks[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly members = signal<UserBoard[]>([]);

  readonly user = toSignal<User | null>(this.store.select(selectUser));

  readonly filterOpen = signal(false);
  readonly assigneesOpen = signal(false);
  readonly filter = signal<BoardFilter>(emptyFilter());
  readonly searchQuery = signal('');
  readonly taskSortField = signal<TaskSortField>('updatedAt');
  readonly taskSortDirection = signal<SortDirection>('desc');
  readonly menuOpen = signal(false);
  readonly accountModalOpen = signal(false);
  readonly activityOpen = signal(false);
  readonly activityTab = signal<'all' | 'comments' | 'summary'>('all');
  readonly activities = signal<BoardActivity[]>([]);
  readonly activityLoading = signal(false);
  readonly pendingColumnDelete = signal<ColumnWithTasks | null>(null);
  readonly starred = signal(false);
  readonly editingBoardName = signal(false);
  boardNameEdit = '';

  readonly selectedTask = signal<Task | null>(null);

  newCardNameByColumn: Record<string, string> = {};
  readonly activeCardInputColumnId = signal<string | null>(null);
  addingListVisible = signal(false);
  newListName = '';

  readonly availableLabels = computed(() => {
    const set = new Map<string, string>();
    for (const t of this.tasks()) {
      for (const item of this.getTaskLabels(t)) {
        if (!set.has(item.text)) set.set(item.text, item.color);
      }
    }
    // Fallback canonical labels used in the UI
    if (!set.size) {
      set.set('Urgent', '#ef4444');
      set.set('Important', '#eab308');
      set.set('No rush', '#22c55e');
    }
    return Array.from(set.entries()).map(([text, color]) => ({ text, color }));
  });

  ngOnInit(): void {
    // Single stream that drives all board data off the `id` query param.
    const boardId$ = this.route.queryParams.pipe(
      map((q) => (q['id'] as string | undefined) ?? null),
    );

    boardId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (!id) {
          this.router.navigate(['/workboard']);
          return;
        }
        if (id === this.boardId()) return;
        this.editingBoardName.set(false);
        this.boardId.set(id);
        this.store.dispatch(loadBoard({ id }));
        this.store.dispatch(loadColumns({ boardId: id }));
        void this.reloadMembers();
      });

    // Board metadata (name, background, share token, etc.).
    boardId$
      .pipe(
        filter((id): id is string => !!id),
        switchMap((id) => this.store.select(selectBoardById(id))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((b) => {
        if (b) {
          this.board.set(b);
          this.rememberRecentBoard(b);
          this.applyStarredState(b.id);
        }
      });

    // Columns of the current board + their tasks — combined into one projection
    // so the UI is rebuilt exactly once per store change.
    const columns$ = boardId$.pipe(
      filter((id): id is string => !!id),
      switchMap((id) => this.store.select(selectColumnsByBoard(id))),
    );

    const tasks$ = this.store.select(selectAllTasks);

    // Fetch tasks whenever the set of columns changes (by id).
    let lastColumnIds = '';
    columns$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cols) => {
        const key = cols.map((c) => c.id).join('|');
        if (key === lastColumnIds) return;
        lastColumnIds = key;
        for (const c of cols) {
          this.store.dispatch(loadTasks({ columnId: c.id }));
        }
      });

    combineLatest([columns$, tasks$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([cols, tasks]) => {
        this.tasks.set(tasks);
        this.columns.set(
          cols.map((c) => ({
            ...c,
            tasks: tasks.filter((t) => t.columnId === c.id),
          })),
        );
      });

    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.i18n.setFromInterfaceLanguage(user?.interfaceLanguage);
        const id = this.boardId();
        if (id) this.applyStarredState(id);
      });
  }

  private applyStarredState(boardId: string): void {
    const userId = this.user()?.id;
    if (!userId) {
      this.starred.set(false);
      return;
    }
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem(`${STARRED_BOARDS_KEY_PREFIX}${userId}`) || '[]',
      );
      this.starred.set(new Set(ids).has(boardId));
    } catch {
      this.starred.set(false);
    }
  }

  toggleStarred(): void {
    const id = this.boardId();
    const u = this.user();
    if (!id || !u) return;
    this.starred.update((prev) => {
      const next = !prev;
      const key = `${STARRED_BOARDS_KEY_PREFIX}${u.id}`;
      let ids: string[] = [];
      try {
        ids = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        ids = [];
      }
      const without = ids.filter((x) => x !== id);
      const out = next ? [...without, id] : without;
      localStorage.setItem(key, JSON.stringify(out));
      return next;
    });
  }

  /**
   * Persists the most recently opened boards to localStorage so they show up
   * in the "Recently viewed" section on the workboard page – including boards
   * the user reached via a shared link.
   */
  private rememberRecentBoard(board: BoardModel): void {
    const userId = this.user()?.id;
    if (!userId) return;

    try {
      const raw = localStorage.getItem(`${RECENT_BOARDS_KEY_PREFIX}${userId}`);
      const list: BoardModel[] = raw ? JSON.parse(raw) : [];
      const next = [board, ...list.filter((b) => b.id !== board.id)].slice(
        0,
        RECENT_BOARDS_LIMIT,
      );
      localStorage.setItem(`${RECENT_BOARDS_KEY_PREFIX}${userId}`, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable – silently ignore.
    }
  }

  async reloadMembers() {
    const id = this.boardId();
    if (!id) return;
    try {
      const list = await this.membersService.list(id);
      this.members.set(list);
    } catch {
      this.members.set([]);
    }
  }

  get filteredActivities(): BoardActivity[] {
    if (this.activityTab() === 'comments') {
      return this.activities().filter((a) => a.type === 'COMMENT');
    }
    return this.activities();
  }

  readonly activitySummary = computed(() => {
    const list = this.activities();
    const total = list.length;
    const comments = list.filter((a) => a.type === 'COMMENT').length;
    const taskChanges = list.filter(
      (a) =>
        a.type === 'TASK_CREATED' ||
        a.type === 'TASK_UPDATED' ||
        a.type === 'TASK_MOVED' ||
        a.type === 'TASK_DELETED',
    ).length;
    const boardChanges = list.filter(
      (a) =>
        a.type === 'BOARD_UPDATED' ||
        a.type === 'COLUMN_CREATED' ||
        a.type === 'COLUMN_UPDATED' ||
        a.type === 'COLUMN_DELETED',
    ).length;
    return { total, comments, taskChanges, boardChanges };
  });

  readonly activityByUser = computed(() => {
    const grouped = new Map<string, { key: string; username: string; count: number }>();
    for (const item of this.activities()) {
      const key = item.user?.id || item.userId || 'unknown';
      const username = item.user?.username || 'Unknown';
      const current = grouped.get(key) || { key, username, count: 0 };
      current.count += 1;
      grouped.set(key, current);
    }
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  });

  async loadActivity() {
    const id = this.boardId();
    if (!id) return;
    this.activityLoading.set(true);
    try {
      const items = await this.boardService.getBoardActivity(id);
      this.activities.set(items);
    } catch {
      this.activities.set([]);
    } finally {
      this.activityLoading.set(false);
    }
  }

  toggleActivityPanel() {
    const next = !this.activityOpen();
    this.activityOpen.set(next);
    if (next) {
      this.activityTab.set('all');
      void this.loadActivity();
    }
  }

  setActivityTab(tab: 'all' | 'comments' | 'summary') {
    this.activityTab.set(tab);
  }

  setTaskSortField(value: string) {
    if (
      value === 'updatedAt' ||
      value === 'dueDate' ||
      value === 'name' ||
      value === 'priority' ||
      value === 'createdAt'
    ) {
      this.taskSortField.set(value);
    }
  }

  setTaskSortDirection(value: string) {
    if (value === 'asc' || value === 'desc') {
      this.taskSortDirection.set(value);
    }
  }

  activityAvatarUrl(a: BoardActivity): string {
    return this.uploads.absoluteUrl(a.user?.avatarUrl);
  }

  get backgroundStyle(): Record<string, string> {
    const url = this.board()?.backgroundImageUrl;
    if (!url) {
      return {
        background:
          'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      };
    }
    return {
      'background-image': `url(${this.uploads.absoluteUrl(url)})`,
      'background-size': 'cover',
      'background-position': 'center',
    };
  }

  get canManageMembers(): boolean {
    const uid = this.user()?.id;
    if (!uid) return false;
    const me = this.members().find((m) => m.user?.id === uid);
    if (!me) return false;
    return !!me.isOwner || me.invitedUserRights === InvitedUserRights.Admin;
  }

  get canManageBoard(): boolean {
    return this.canManageMembers;
  }

  get canEditTasks(): boolean {
    const uid = this.user()?.id;
    if (!uid) return false;
    const me = this.members().find((m) => m.user?.id === uid);
    if (!me) return false;
    if (me.isOwner) return true;
    return (
      me.invitedUserRights === InvitedUserRights.Member ||
      me.invitedUserRights === InvitedUserRights.Admin
    );
  }

  get memberUserIds(): string[] {
    return this.members().map((m) => m.userId);
  }

  beginBoardRename(): void {
    if (!this.canManageBoard) return;
    this.boardNameEdit = this.board()?.name || '';
    this.editingBoardName.set(true);
    setTimeout(() => {
      this.boardNameInput?.nativeElement?.focus();
      this.boardNameInput?.nativeElement?.select();
    });
  }

  saveBoardName(): void {
    this.editingBoardName.set(false);
    const t = this.boardNameEdit.trim();
    if (!t || t === (this.board()?.name ?? '')) return;
    const id = this.boardId();
    if (!id) return;
    this.store.dispatch(updateBoard({ id, payload: { name: t } }));
    if (this.activityOpen()) void this.loadActivity();
  }

  cancelBoardName(): void {
    this.editingBoardName.set(false);
    this.boardNameEdit = this.board()?.name || '';
  }

  // ---------- Filter ----------

  get filteredColumns(): ColumnWithTasks[] {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.filter();
    const kw = (f.keyword || '').trim().toLowerCase();
    const me = this.user()?.id;
    const now = new Date();
    const within = (days: number, date: Date) =>
      (date.getTime() - now.getTime()) / 86400000 <= days &&
      date.getTime() >= now.getTime();
    const activeWithin = (days: number, date: Date) =>
      (now.getTime() - date.getTime()) / 86400000 <= days;

    const field = this.taskSortField();
    const dir = this.taskSortDirection() === 'asc' ? 1 : -1;

    return this.columns().map((col) => {
      const filtered = col.tasks.filter((t) => {
        const tlabels = this.getTaskLabels(t).map((l) => l.text);
        if (q) {
          const haystack = [
            t.name,
            t.description ?? '',
            t.assignee?.username ?? '',
            ...(t.labels ?? []),
            ...(t.attachments ?? []),
            ...(t.comments ?? []).map((c) => c.content),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (kw) {
          const hay =
            `${t.name} ${t.description ?? ''} ${tlabels.join(' ')}`.toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        if (f.members === 'none' && t.assigneeId) return false;
        if (f.members === 'me' && t.assigneeId !== me) return false;
        if (Array.isArray(f.members)) {
          if (!t.assigneeId || !f.members.includes(t.assigneeId)) return false;
        }

        if (f.cardStatus === 'complete' && !t.completed) return false;
        if (f.cardStatus === 'incomplete' && t.completed) return false;

        const due = t.dueDate ? new Date(t.dueDate) : null;
        if (f.dueDate === 'none' && due) return false;
        if (f.dueDate === 'overdue' && (!due || due.getTime() >= now.getTime())) return false;
        if (f.dueDate === 'nextDay' && (!due || !within(1, due))) return false;
        if (f.dueDate === 'nextWeek' && (!due || !within(7, due))) return false;
        if (f.dueDate === 'nextMonth' && (!due || !within(30, due))) return false;

        if (f.labels === 'none' && tlabels.length) return false;
        if (Array.isArray(f.labels)) {
          if (!tlabels.some((l) => (f.labels as string[]).includes(l))) return false;
        }

        const updated = t.updatedAt ? new Date(t.updatedAt) : null;
        if (f.activity !== 'any' && updated) {
          if (f.activity === 'week' && !activeWithin(7, updated)) return false;
          if (f.activity === 'twoWeeks' && !activeWithin(14, updated)) return false;
          if (f.activity === 'fourWeeks' && !activeWithin(28, updated)) return false;
          if (f.activity === 'none' && activeWithin(28, updated)) return false;
        }

        return true;
      });

      const sorted = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (field === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (field === 'priority') {
          const rank = (p: Priority | undefined) =>
            p === Priority.High ? 3 : p === Priority.Medium ? 2 : 1;
          cmp = rank(a.priority) - rank(b.priority);
        } else {
          const toTime = (v: string | null | undefined) => (v ? new Date(v).getTime() : -1);
          if (field === 'dueDate') cmp = toTime(a.dueDate) - toTime(b.dueDate);
          if (field === 'createdAt') cmp = toTime(a.createdAt) - toTime(b.createdAt);
          if (field === 'updatedAt') cmp = toTime(a.updatedAt) - toTime(b.updatedAt);
        }
        return cmp * dir;
      });

      return {
        ...col,
        tasks: sorted,
      };
    });
  }

  setFilter(f: BoardFilter) {
    this.filter.set(f);
  }

  /**
   * Returns the labels used by filters/search. If a task has explicit labels,
   * those are used. Otherwise we expose the same priority-derived badge labels
   * shown on the task cards (Urgent/Important/No rush).
   */
  private getTaskLabels(task: Task): { text: string; color: string }[] {
    if (task.labels?.length) {
      return task.labels.map((raw) => {
        const [text, color] = raw.split('|');
        return { text: text || 'Label', color: color || '#6366f1' };
      });
    }
    return [PRIORITY_LABELS[task.priority ?? Priority.Medium]];
  }

  // ---------- Columns ----------

  addColumn() {
    if (!this.canEditTasks) return;
    const name = this.newListName.trim();
    const id = this.boardId();
    if (!name || !id) return;
    const existing = this.columns();
    const color = COLUMN_COLORS[existing.length % COLUMN_COLORS.length];
    const nextPosition = existing.length
      ? Math.max(...existing.map((c) => Number(c.position) || 0)) + 1
      : 0;
    this.store.dispatch(
      createColumn({
        payload: {
          boardId: id,
          name,
          color,
          position: nextPosition,
        },
      }),
    );
    this.newListName = '';
    this.addingListVisible.set(false);
    if (this.activityOpen()) void this.loadActivity();
  }

  requestRemoveColumn(col: ColumnWithTasks) {
    if (!this.canEditTasks) return;
    this.pendingColumnDelete.set(col);
  }

  removeColumnConfirmed() {
    const col = this.pendingColumnDelete();
    if (!col) return;
    this.pendingColumnDelete.set(null);
    this.store.dispatch(deleteColumn({ id: col.id }));
    if (this.activityOpen()) void this.loadActivity();
  }

  cancelRemoveColumn() {
    this.pendingColumnDelete.set(null);
  }

  renameColumn(col: ColumnWithTasks, value: string) {
    if (!this.canEditTasks) return;
    const name = (value || '').trim();
    if (!name || name === col.name) return;
    this.store.dispatch(updateColumn({ id: col.id, payload: { name } }));
    if (this.activityOpen()) void this.loadActivity();
  }

  // ---------- Tasks ----------

  addCard(col: ColumnWithTasks) {
    if (!this.canEditTasks) return;
    const name = (this.newCardNameByColumn[col.id] || '').trim();
    if (!name) return;
    this.store.dispatch(
      createTask({
        payload: { name, columnId: col.id, priority: Priority.Medium },
      }),
    );
    this.newCardNameByColumn[col.id] = '';
    this.activeCardInputColumnId.set(null);
    if (this.activityOpen()) void this.loadActivity();
  }

  onCardInputFocus(columnId: string) {
    this.activeCardInputColumnId.set(columnId);
  }

  onCardInputBlur(columnId: string) {
    // Delay so clicking the add button doesn't get swallowed by blur.
    setTimeout(() => {
      if (this.activeCardInputColumnId() === columnId) {
        this.activeCardInputColumnId.set(null);
      }
    }, 120);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, columnId: string) {
    if (!this.canEditTasks) return;
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain');
    if (!taskId) return;
    const task = this.tasks().find((t) => t.id === taskId);
    if (!task || task.columnId === columnId) return;
    this.store.dispatch(moveTask({ id: taskId, columnId }));
    if (this.activityOpen()) void this.loadActivity();
  }

  openTask(t: Task) {
    this.selectedTask.set(t);
  }

  closeTask() {
    this.selectedTask.set(null);
  }

  saveTask(patch: Partial<Task>) {
    if (!this.canEditTasks) return;
    const t = this.selectedTask();
    if (!t) return;
    // Only send the fields the user actually changed. Backend treats
    // `undefined` as "no change" and `null` as "clear", so we forward as-is.
    this.store.dispatch(
      updateTask({
        id: t.id,
        payload: patch as any,
      }),
    );
    this.selectedTask.set({ ...t, ...patch } as Task);
    if (this.activityOpen()) void this.loadActivity();
  }

  deleteTaskCard(id: string) {
    if (!this.canEditTasks) return;
    this.store.dispatch(deleteTask({ id }));
    this.selectedTask.set(null);
    if (this.activityOpen()) void this.loadActivity();
  }

  onTaskModalActivityChanged() {
    if (this.activityOpen()) void this.loadActivity();
  }

  // ---------- Board background ----------

  onBoardImageClick() {
    if (!this.canManageBoard) return;
    this.boardImageInput?.nativeElement.click();
  }

  async onBoardImageSelected(event: Event) {
    if (!this.canManageBoard) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const res = await this.uploads.uploadImage(file);
    const id = this.boardId();
    if (!id) return;
    this.store.dispatch(
      updateBoard({
        id,
        payload: { backgroundImageUrl: res.url },
      } as any),
    );
    if (this.activityOpen()) void this.loadActivity();
    input.value = '';
  }

  clearBoardBackground() {
    if (!this.canManageBoard) return;
    const id = this.boardId();
    if (!id) return;
    this.store.dispatch(
      updateBoard({ id, payload: { backgroundImageUrl: null } }),
    );
    if (this.activityOpen()) void this.loadActivity();
  }

  onLogout() {
    this.accountModalOpen.set(false);
    this.store.dispatch(logOut());
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleAccountModal() {
    this.accountModalOpen.set(!this.accountModalOpen());
  }

  openAccountModal() {
    this.accountModalOpen.set(true);
  }

  openManageAccount() {
    this.accountModalOpen.set(false);
    this.router.navigateByUrl('/settings/manage-profile');
  }

  onBoardChanged(updated: BoardModel) {
    this.board.set(updated);
    this.store.dispatch(loadBoard({ id: updated.id }));
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.menuOpen()) this.menuOpen.set(false);
    if (this.accountModalOpen()) this.accountModalOpen.set(false);
    if (this.filterOpen()) this.filterOpen.set(false);
    if (this.assigneesOpen()) this.assigneesOpen.set(false);
  }

  trackColumn = (_: number, c: ColumnWithTasks) => c.id;
  trackTask = (_: number, t: Task) => t.id;
  trackActivity = (_: number, a: BoardActivity) => a.id;
}
