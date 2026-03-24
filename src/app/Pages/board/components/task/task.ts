import { Component, Input } from '@angular/core';
import { Task } from '../../../../core/interface';

@Component({
  selector: 'app-task',
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class TaskComponent {
  @Input() task!: Task;
  
  onDragStart(event: DragEvent) {
    event.dataTransfer?.setData('text', this.task.id.toString());
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
  }
}