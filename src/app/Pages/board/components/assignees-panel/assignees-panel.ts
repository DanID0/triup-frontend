import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Board, InvitedUserRights, UserBoard } from '../../../../core/interface';
import { BoardMembersService } from '../../../../Services/board-members.service';

@Component({
  selector: 'app-assignees-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignees-panel.html',
  styleUrls: ['./assignees-panel.css'],
})
export class AssigneesPanelComponent implements OnInit {
  @Input() board!: Board;
  @Input() members: UserBoard[] = [];
  @Input() canManage = true;

  @Output() closed = new EventEmitter<void>();
  @Output() membersChanged = new EventEmitter<UserBoard[]>();
  @Output() boardChanged = new EventEmitter<Board>();

  private readonly membersService = inject(BoardMembersService);

  readonly shareOpen = signal(false);
  readonly shareTab = signal<'members'>('members');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly copyNotice = signal(false);

  rightsOptions: InvitedUserRights[] = [
    InvitedUserRights.Guest,
    InvitedUserRights.Member,
    InvitedUserRights.Admin,
  ];

  ngOnInit(): void {}

  // The shared link points to the regular board page (loaded via the share
  // token route). The recipient lands on the same board UI, but read-only.
  get shareLink(): string {
    if (!this.board?.shareToken) return '';
    return `${window.location.origin}/b/${this.board.shareToken}`;
  }

  isOwner(m: UserBoard): boolean {
    return !!m.isOwner;
  }

  openShare() {
    this.error.set(null);
    this.shareOpen.set(true);
  }

  closeShare() {
    this.shareOpen.set(false);
  }

  async toggleShare() {
    this.busy.set(true);
    try {
      const updated = this.board.shareToken
        ? await this.membersService.disableShare(this.board.id)
        : await this.membersService.enableShare(this.board.id);
      this.boardChanged.emit(updated);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to update share link');
    } finally {
      this.busy.set(false);
    }
  }

  async copyShareLink() {
    if (!this.board.shareToken) {
      // Auto-create a link the first time the user clicks Copy.
      await this.toggleShare();
    }
    const link = this.shareLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      this.copyNotice.set(true);
      setTimeout(() => this.copyNotice.set(false), 1600);
    } catch {
      // ignore clipboard failure (e.g. http context)
    }
  }

  async removeMember(m: UserBoard) {
    if (this.isOwner(m)) return;
    this.busy.set(true);
    try {
      await this.membersService.remove(this.board.id, m.id);
      this.membersChanged.emit(this.members.filter((x) => x.id !== m.id));
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to remove member');
    } finally {
      this.busy.set(false);
    }
  }

  async changeRights(m: UserBoard, rights: InvitedUserRights) {
    if (this.isOwner(m)) return;
    this.busy.set(true);
    try {
      const updated = await this.membersService.update(
        this.board.id,
        m.id,
        rights,
      );
      this.membersChanged.emit(
        this.members.map((x) => (x.id === m.id ? updated : x)),
      );
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to change rights');
    } finally {
      this.busy.set(false);
    }
  }
}
