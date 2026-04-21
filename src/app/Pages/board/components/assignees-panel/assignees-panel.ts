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

  readonly adding = signal(false);
  readonly newEmail = signal('');
  readonly newRights = signal<InvitedUserRights>(InvitedUserRights.Member);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly copyNotice = signal(false);
  rightsOptions: InvitedUserRights[] = [
    InvitedUserRights.Guest,
    InvitedUserRights.Member,
    InvitedUserRights.Admin,
  ];

  ngOnInit(): void {}

  get shareLink(): string {
    if (!this.board.shareToken) return '';
    return `${window.location.origin}/b/${this.board.shareToken}`;
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
    const link = this.shareLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      this.copyNotice.set(true);
      setTimeout(() => this.copyNotice.set(false), 1600);
    } catch {
      // ignore clipboard failure
    }
  }

  async submitInvite() {
    const email = this.newEmail().trim();
    if (!email) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const member = await this.membersService.add(
        this.board.id,
        email,
        this.newRights(),
      );
      this.membersChanged.emit([...this.members, member]);
      this.newEmail.set('');
      this.adding.set(false);
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to add member');
    } finally {
      this.busy.set(false);
    }
  }

  async removeMember(m: UserBoard) {
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
    this.busy.set(true);
    try {
      const updated = await this.membersService.update(this.board.id, m.id, rights);
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
