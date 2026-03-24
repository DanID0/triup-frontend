import { Component, signal } from '@angular/core';
import { TaskComponent } from '../components/task/task';
import { Column } from '../../../core/interface';
import { Task } from '../../../core/interface';
import { BoardService } from '../../../Services/board.service';
import { Store } from '@ngrx/store';
@Component({
  selector: 'app-board',
  imports: [TaskComponent],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  columns: Column[] = [];
  tasks: Task[] = [];
  constructor(private boardService: BoardService,  private store: Store){}
 
  onDrop(event: DragEvent, id: string) {
    event.preventDefault();
    const taskId = Number(event.dataTransfer?.getData("text"));
   


    const draggingEl = document.querySelector(".dragging");
    if (draggingEl) draggingEl.classList.remove("dragging");
  }

  onDragStart(event: DragEvent, task: Task) {
    event.dataTransfer?.setData("text", task.id.toString());
    (event.target as HTMLElement).classList.add("dragging");
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove("dragging");
  }
}
