import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserBoard } from '../../../../core/interface';
import { I18nPipe } from '../../../../core/i18n.pipe';

export type CardStatus = 'all' | 'complete' | 'incomplete';

export type DueDateFilter =
  | 'any'
  | 'none'
  | 'overdue'
  | 'nextDay'
  | 'nextWeek'
  | 'nextMonth';

export type ActivityFilter = 'any' | 'week' | 'twoWeeks' | 'fourWeeks' | 'none';

export interface BoardFilter {
  keyword: string;
  members: 'any' | 'none' | 'me' | string[];
  cardStatus: CardStatus;
  dueDate: DueDateFilter;
  labels: 'any' | 'none' | string[];
  activity: ActivityFilter;
}

export const emptyFilter = (): BoardFilter => ({
  keyword: '',
  members: 'any',
  cardStatus: 'all',
  dueDate: 'any',
  labels: 'any',
  activity: 'any',
});

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.css'],
})
export class FilterPanelComponent {
  @Input() members: UserBoard[] = [];
  @Input() labels: { text: string; color: string }[] = [];
  @Input() value: BoardFilter = emptyFilter();

  @Output() valueChange = new EventEmitter<BoardFilter>();
  @Output() closed = new EventEmitter<void>();

  readonly showMembers = signal(false);

  dueDateOptions: { id: DueDateFilter; label: string; color: string }[] = [
    { id: 'none', label: 'noDates', color: '#64748b' },
    { id: 'overdue', label: 'overdue', color: '#ef4444' },
    { id: 'nextDay', label: 'dueNextDay', color: '#f59e0b' },
    { id: 'nextWeek', label: 'dueNextWeek', color: '#22c55e' },
    { id: 'nextMonth', label: 'dueNextMonth', color: '#3b82f6' },
  ];

  activityOptions: { id: ActivityFilter; label: string }[] = [
    { id: 'week', label: 'activeLastWeek' },
    { id: 'twoWeeks', label: 'activeLastTwoWeeks' },
    { id: 'fourWeeks', label: 'activeLastFourWeeks' },
    { id: 'none', label: 'withoutActivityLastFourWeeks' },
  ];

  emit() {
    this.valueChange.emit({ ...this.value });
  }

  toggleMember(memberId: string) {
    const list = Array.isArray(this.value.members) ? [...this.value.members] : [];
    const idx = list.indexOf(memberId);
    if (idx === -1) list.push(memberId);
    else list.splice(idx, 1);
    this.value = { ...this.value, members: list.length ? list : 'any' };
    this.emit();
  }

  setMembers(mode: 'any' | 'none' | 'me') {
    this.value = { ...this.value, members: mode };
    this.emit();
  }

  isMemberSelected(id: string): boolean {
    return Array.isArray(this.value.members) && this.value.members.includes(id);
  }

  toggleLabel(text: string) {
    const list = Array.isArray(this.value.labels) ? [...this.value.labels] : [];
    const idx = list.indexOf(text);
    if (idx === -1) list.push(text);
    else list.splice(idx, 1);
    this.value = { ...this.value, labels: list.length ? list : 'any' };
    this.emit();
  }

  isLabelSelected(text: string): boolean {
    return Array.isArray(this.value.labels) && this.value.labels.includes(text);
  }

  setLabels(mode: 'any' | 'none') {
    this.value = { ...this.value, labels: mode };
    this.emit();
  }
}
