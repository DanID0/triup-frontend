import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Board as BoardModel, Task } from '../../../core/interface';
import { BoardMembersService } from '../../../Services/board-members.service';
import { UploadService } from '../../../Services/upload.service';
import { TaskComponent } from '../components/task/task';
import { TaskModalComponent } from '../components/task-modal/task-modal';

@Component({
  selector: 'app-guest-board',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskComponent, TaskModalComponent],
  templateUrl: './guest-board.html',
  styleUrls: ['./guest-board.css'],
})
export class GuestBoard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly members = inject(BoardMembersService);
  private readonly uploads = inject(UploadService);

  readonly board = signal<BoardModel | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedTask = signal<Task | null>(null);

  readonly backgroundStyle = computed<Record<string, string>>(() => {
    const url = this.board()?.backgroundImageUrl;
    if (!url) {
      return {
        background:
          'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      } as Record<string, string>;
    }
    return {
      'background-image': `url(${this.uploads.absoluteUrl(url)})`,
      'background-size': 'cover',
      'background-position': 'center',
    } as Record<string, string>;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (p) => {
        const token = p.get('token');
        if (!token) {
          this.router.navigate(['/']);
          return;
        }
        try {
          const b = await this.members.getPublicBoard(token);
          this.board.set(b);
        } catch (e: any) {
          this.error.set(e?.error?.message || 'This shared board is unavailable.');
        }
      });
  }

  openTask(t: Task) {
    this.selectedTask.set(t);
  }

  closeTask() {
    this.selectedTask.set(null);
  }

  trackColumn = (_: number, c: { id: string }) => c.id;
  trackTask = (_: number, t: { id: string }) => t.id;
}
