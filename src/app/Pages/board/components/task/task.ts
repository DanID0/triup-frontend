import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../../core/interface';
import { UploadService } from '../../../../Services/upload.service';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class TaskComponent {
  @Input() task!: Task;
  @Input() readonly = false;
  @Output() open = new EventEmitter<Task>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; task: Task }>();
  @Output() dragEnd = new EventEmitter<DragEvent>();

  private readonly uploads = inject(UploadService);

  get coverUrl(): string | null {
    const first = this.task.attachments?.[0];
    return first ? this.uploads.absoluteUrl(first) : null;
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
      return { color: '#22c55e', label, status: 'Complete' };
    }
    if (diffDays < 0) {
      return { color: '#ef4444', label, status: 'Overdue' };
    }
    if (diffDays <= 1) {
      return { color: '#f59e0b', label, status: 'Due in the next day' };
    }
    if (diffDays <= 7) {
      return { color: '#22c55e', label, status: 'Due in the next week' };
    }
    if (diffDays <= 30) {
      return { color: '#3b82f6', label, status: 'Due in the next month' };
    }
    return { color: '#64748b', label, status: 'Upcoming' };
  }

  get labelColor(): { color: string; text: string } | null {
    const raw = this.task.labels?.[0];
    if (!raw) {
      if (this.task.priority === 'High')
        return { color: '#ef4444', text: 'Urgent' };
      if (this.task.priority === 'Low')
        return { color: '#22c55e', text: 'No rush' };
      return { color: '#eab308', text: 'Medium' };
    }
    const [text, color] = raw.split('|');
    return { text: text || 'Label', color: color || '#6366f1' };
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
