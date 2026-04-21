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
