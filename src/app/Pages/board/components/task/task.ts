import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../../core/interface';
import { UploadService } from '../../../../Services/upload.service';
import { I18nPipe } from '../../../../core/i18n.pipe';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, I18nPipe],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class TaskComponent {
  @Input() task!: Task;
  @Input() readonly = false;
  /** Current board member ids. If provided, hidden assignees are filtered out. */
  @Input() memberIds: string[] | null = null;
  @Output() open = new EventEmitter<Task>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; task: Task }>();
  @Output() dragEnd = new EventEmitter<DragEvent>();

  private readonly uploads = inject(UploadService);

  get coverUrl(): string | null {
    const first = this.task.attachments?.[0];
    return first ? this.uploads.absoluteUrl(first) : null;
  }

  get assigneePhotoUrl(): string {
    const a = this.task.assignee;
    if (!a?.avatarUrl) return '';
    return this.uploads.absoluteUrl(a.avatarUrl);
  }

  get showAssignee(): boolean {
    const assignee = this.task.assignee;
    if (!assignee) return false;
    if (this.memberIds === null) return true;
    return this.memberIds.includes(assignee.id);
  }

  /**
   * Maps a task's due date to one of the filter "buckets" used by the
   * filter panel (Overdue / next day / next week / next month) and returns
   * presentation data for the pill displayed on the card.
   */
  get dueBadge(): { color: string; label: string; status: string } | null {
    if (!this.task.dueDate) return null;
    const due = new Date(this.task.dueDate);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / 86400000;

    const label = due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    if (this.task.completed) {
      return { color: '#22c55e', label, status: 'done' };
    }
    if (diffDays < 0) {
      return { color: '#ef4444', label, status: 'overdue' };
    }
    if (diffDays <= 1) {
      return { color: '#f59e0b', label, status: 'dueNextDay' };
    }
    if (diffDays <= 7) {
      return { color: '#22c55e', label, status: 'dueNextWeek' };
    }
    if (diffDays <= 30) {
      return { color: '#3b82f6', label, status: 'dueNextMonth' };
    }
    return { color: '#64748b', label, status: 'upcoming' };
  }

  get labelColor(): { color: string; text: string } | null {
    const raw = this.task.labels?.[0];
    if (!raw) {
      if (this.task.priority === 'High')
        return { color: '#ef4444', text: 'urgent' };
      if (this.task.priority === 'Low')
        return { color: '#22c55e', text: 'noRush' };
      return { color: '#eab308', text: 'medium' };
    }
    const [text, color] = raw.split('|');
    return { text: text || 'label', color: color || '#6366f1' };
  }

  onDragStart(event: DragEvent) {
    if (this.readonly) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', this.task.id);
    (event.target as HTMLElement).classList.add('dragging');
    this.dragStart.emit({ event, task: this.task });
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.dragEnd.emit(event);
  }

  onClick() {
    this.open.emit(this.task);
  }
}
