import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { Board as BoardModel, Task, User } from '../../../core/interface';
import { BoardMembersService } from '../../../Services/board-members.service';
import { UploadService } from '../../../Services/upload.service';
import { UserService } from '../../../Services/user.service';
import { TaskComponent } from '../components/task/task';
import { TaskModalComponent } from '../components/task-modal/task-modal';
import { selectUser } from '../../../store/user-store/user.selectors';
import { getUserSuccess } from '../../../store/user-store/user.actions';

const RECENT_BOARDS_KEY = 'triup:recentBoards';
const RECENT_BOARDS_LIMIT = 5;

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
  private readonly userService = inject(UserService);
  private readonly store = inject(Store);

  readonly board = signal<BoardModel | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedTask = signal<Task | null>(null);
  readonly token = signal<string | null>(null);

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
        this.token.set(token);
        await this.loadBoard(token);
      });
  }

  private async loadBoard(token: string): Promise<void> {
    // Resolve the current user. The store may already have it (after login or
    // a recent visit), otherwise we ask the server. A failure here just means
    // the visitor is anonymous – we fall back to the read-only public view.
    let user = await firstValueFrom(this.store.select(selectUser));
    if (!user) {
      try {
        user = await this.userService.getUser();
        if (user) this.store.dispatch(getUserSuccess({ user }));
      } catch {
        user = null;
      }
    }

    if (user) {
      await this.joinAndRedirect(token, user);
      return;
    }

    // Anonymous visitor – render the public read-only board so they can see
    // the background, columns, and cards before being prompted to log in.
    try {
      const b = await this.members.getPublicBoard(token);
      this.board.set(b);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'This shared board is unavailable.');
    }
  }

  private async joinAndRedirect(token: string, _user: User): Promise<void> {
    try {
      const board = await this.members.joinViaShareToken(token);
      this.rememberRecentBoard(board);
      this.router.navigate(['/board'], { queryParams: { id: board.id } });
    } catch (e: any) {
      // If join fails (token revoked, network error…) fall back to the public
      // view so the user at least sees what was shared with them.
      try {
        const b = await this.members.getPublicBoard(token);
        this.board.set(b);
      } catch {
        this.error.set(
          e?.error?.message || 'This shared board is unavailable.',
        );
      }
    }
  }

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
      // localStorage may be unavailable in some browser modes – ignore.
    }
  }

  /**
   * Builds the redirect target the login page should send the user back to
   * after a successful sign in (i.e. the original shared link URL).
   */
  get loginRedirect(): string {
    const t = this.token();
    return t ? `/b/${t}` : '/';
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
