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
  Column,
  Priority,
  Task,
  User,
  UserBoard,
} from '../../../core/interface';
import { TaskComponent } from '../components/task/task';
import { TaskModalComponent } from '../components/task-modal/task-modal';
import { FilterPanelComponent, BoardFilter, emptyFilter } from '../components/filter-panel/filter-panel';
import { AssigneesPanelComponent } from '../components/assignees-panel/assignees-panel';

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

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

const COLUMN_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#ef4444',
  '#a855f7',
  '#06b6d4',
];

const RECENT_BOARDS_KEY = 'triup:recentBoards';
const RECENT_BOARDS_LIMIT = 5;
const PRIORITY_LABELS: Record<Priority, { text: string; color: string }> = {
  [Priority.High]: { text: 'Urgent', color: '#ef4444' },
  [Priority.Medium]: { text: 'Important', color: '#eab308' },
  [Priority.Low]: { text: 'No rush', color: '#22c55e' },
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
  private readonly uploads = inject(UploadService);

  @ViewChild('boardImageInput') boardImageInput?: ElementRef<HTMLInputElement>;

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
  readonly menuOpen = signal(false);
  readonly starred = signal(false);

  readonly selectedTask = signal<Task | null>(null);

  newCardNameByColumn: Record<string, string> = {};
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
  }

  /**
   * Persists the most recently opened boards to localStorage so they show up
   * in the "Recently viewed" section on the workboard page – including boards
   * the user reached via a shared link.
   */
  private rememberRecentBoard(board: BoardModel): void {
    try {
      const raw = localStorage.getItem(RECENT_BOARDS_KEY);
      const list: BoardModel[] = raw ? JSON.parse(raw) : [];
      const next = [board, ...list.filter((b) => b.id !== board.id)].slice(
        0,
        RECENT_BOARDS_LIMIT,
      );
      localStorage.setItem(RECENT_BOARDS_KEY, JSON.stringify(next));
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

  get isOwner(): boolean {
    const uid = this.user()?.id;
    // Treat workspace owner or admin member as having management rights
    const b = this.board();
    if (!b || !uid) return false;
    if ((b as any).workspace?.userId === uid) return true;
    const me = this.members().find((m) => m.user?.id === uid);
    return me?.invitedUserRights === 'Admin' || me?.invitedUserRights === 'Member';
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

    return this.columns().map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => {
        const tlabels = this.getTaskLabels(t).map((l) => l.text);
        if (q && !t.name.toLowerCase().includes(q)) return false;
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
      }),
    }));
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
  }

  removeColumn(col: ColumnWithTasks) {
    if (!confirm(`Delete list "${col.name}"?`)) return;
    this.store.dispatch(deleteColumn({ id: col.id }));
  }

  renameColumn(col: ColumnWithTasks, value: string) {
    const name = (value || '').trim();
    if (!name || name === col.name) return;
    this.store.dispatch(updateColumn({ id: col.id, payload: { name } }));
  }

  // ---------- Tasks ----------

  addCard(col: ColumnWithTasks) {
    const name = (this.newCardNameByColumn[col.id] || '').trim();
    if (!name) return;
    this.store.dispatch(
      createTask({
        payload: { name, columnId: col.id, priority: Priority.Medium },
      }),
    );
    this.newCardNameByColumn[col.id] = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, columnId: string) {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain');
    if (!taskId) return;
    const task = this.tasks().find((t) => t.id === taskId);
    if (!task || task.columnId === columnId) return;
    this.store.dispatch(moveTask({ id: taskId, columnId }));
  }

  openTask(t: Task) {
    this.selectedTask.set(t);
  }

  closeTask() {
    this.selectedTask.set(null);
  }

  saveTask(patch: Partial<Task>) {
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
  }

  deleteTaskCard(id: string) {
    this.store.dispatch(deleteTask({ id }));
    this.selectedTask.set(null);
  }

  // ---------- Board background ----------

  onBoardImageClick() {
    this.boardImageInput?.nativeElement.click();
  }

  async onBoardImageSelected(event: Event) {
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
    input.value = '';
  }

  clearBoardBackground() {
    const id = this.boardId();
    if (!id) return;
    this.store.dispatch(
      updateBoard({ id, payload: { backgroundImageUrl: null } }),
    );
  }

  onLogout() {
    this.store.dispatch(logOut());
  }

  onBoardChanged(updated: BoardModel) {
    this.board.set(updated);
    this.store.dispatch(loadBoard({ id: updated.id }));
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.menuOpen()) this.menuOpen.set(false);
    if (this.filterOpen()) this.filterOpen.set(false);
    if (this.assigneesOpen()) this.assigneesOpen.set(false);
  }

  trackColumn = (_: number, c: ColumnWithTasks) => c.id;
  trackTask = (_: number, t: Task) => t.id;
}
