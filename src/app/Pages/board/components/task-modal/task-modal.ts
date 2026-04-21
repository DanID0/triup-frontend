import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { Comment, Priority, Task, User, UserBoard } from '../../../../core/interface';
import { UploadService } from '../../../../Services/upload.service';

import {
  createComment,
  deleteComment,
  loadComments,
} from '../../../../store/comment-store/comment.actions';
import { selectCommentsByTask } from '../../../../store/comment-store/comment.selectors';
import { selectUser } from '../../../../store/user-store/user.selectors';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './task-modal.html',
  styleUrls: ['./task-modal.css'],
})
export class TaskModalComponent implements OnInit, OnChanges {
  @Input() task!: Task;
  @Input() members: UserBoard[] = [];
  @Input() readonlyMode = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Task>>();
  @Output() delete = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private readonly store = inject(Store);
  private readonly uploads = inject(UploadService);
  private readonly destroyRef = inject(DestroyRef);

  readonly comments = signal<Comment[]>([]);
  readonly newComment = signal('');
  private commentsSub?: Subscription;
  readonly showDatePicker = signal(false);
  readonly showMembersPicker = signal(false);
  readonly descEditing = signal(false);
  readonly uploading = signal(false);
  readonly currentUser = signal<User | null>(null);

  readonly priorities: Priority[] = [Priority.Low, Priority.Medium, Priority.High];

  editing: {
    name: string;
    description: string;
    completed: boolean;
    priority: Priority;
    dueDate: string | null;
    assigneeId: string | null;
    labels: string[];
    attachments: string[];
  } = {
    name: '',
    description: '',
    completed: false,
    priority: Priority.Medium,
    dueDate: null,
    assigneeId: null,
    labels: [],
    attachments: [],
  };

  readonly attachmentUrls = computed(() =>
    this.editing.attachments.map((u) => this.uploads.absoluteUrl(u)),
  );

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u) => this.currentUser.set(u));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.editing = {
        name: this.task.name,
        description: this.task.description ?? '',
        completed: !!this.task.completed,
        priority: this.task.priority ?? Priority.Medium,
        dueDate: this.task.dueDate
          ? new Date(this.task.dueDate).toISOString().slice(0, 10)
          : null,
        assigneeId: this.task.assigneeId ?? null,
        labels: [...(this.task.labels ?? [])],
        attachments: [...(this.task.attachments ?? [])],
      };
      this.descEditing.set(false);

      // Replace the previous subscription so opening a different task doesn't
      // leak subscriptions. Skip comment fetching entirely in readonly/guest
      // mode — the backend endpoint requires authentication.
      this.commentsSub?.unsubscribe();
      this.comments.set([]);
      if (!this.readonlyMode) {
        this.store.dispatch(loadComments({ taskId: this.task.id }));
        this.commentsSub = this.store
          .select(selectCommentsByTask(this.task.id))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((list) => this.comments.set(list));
      }
    }
  }

  get assigneeName(): string {
    if (!this.editing.assigneeId) return 'Members';
    const m = this.members.find((x) => x.user?.id === this.editing.assigneeId);
    return m?.user?.username || 'Members';
  }

  toggleCompleted() {
    if (this.readonlyMode) return;
    this.editing.completed = !this.editing.completed;
    this.emitSave({ completed: this.editing.completed });
  }

  emitSave(patch: Partial<Task>) {
    this.save.emit(patch);
  }

  saveName() {
    const trimmed = this.editing.name.trim();
    if (!trimmed || trimmed === this.task.name) return;
    this.emitSave({ name: trimmed });
  }

  saveDescription() {
    this.descEditing.set(false);
    if ((this.editing.description ?? '') === (this.task.description ?? '')) return;
    this.emitSave({ description: this.editing.description || '' });
  }

  setPriority(p: Priority) {
    this.editing.priority = p;
    this.emitSave({ priority: p });
  }

  setDueDate(date: string | null) {
    this.editing.dueDate = date;
    this.emitSave({ dueDate: date ? new Date(date).toISOString() : null });
    this.showDatePicker.set(false);
  }

  setAssignee(userId: string | null) {
    this.editing.assigneeId = userId;
    this.emitSave({ assigneeId: userId });
    this.showMembersPicker.set(false);
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.uploading.set(true);
    try {
      const newUrls: string[] = [];
      for (const f of Array.from(input.files)) {
        const res = await this.uploads.uploadImage(f);
        newUrls.push(res.url);
      }
      const merged = [...this.editing.attachments, ...newUrls];
      this.editing.attachments = merged;
      this.emitSave({ attachments: merged });
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  removeAttachment(url: string) {
    const merged = this.editing.attachments.filter((x) => x !== url);
    this.editing.attachments = merged;
    this.emitSave({ attachments: merged });
  }

  openFilePicker() {
    this.fileInput?.nativeElement.click();
  }

  addComment() {
    const content = this.newComment().trim();
    if (!content) return;
    this.store.dispatch(createComment({ payload: { taskId: this.task.id, content } }));
    this.newComment.set('');
  }

  removeComment(id: string) {
    this.store.dispatch(deleteComment({ id }));
  }

  onDelete() {
    if (!confirm('Delete this card?')) return;
    this.delete.emit(this.task.id);
  }
}
