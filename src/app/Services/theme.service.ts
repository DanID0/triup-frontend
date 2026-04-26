import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'triup:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>('dark');

  constructor() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      this.mode.set(saved);
    }
    this.applyToDocument();
  }

  isDark(): boolean {
    return this.mode() === 'dark';
  }

  toggle(): void {
    this.mode.set(this.isDark() ? 'light' : 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, this.mode());
    this.applyToDocument();
  }

  private applyToDocument(): void {
    const root = this.document.documentElement;
    root.classList.toggle('theme-dark', this.mode() === 'dark');
    root.classList.toggle('theme-light', this.mode() === 'light');
  }
}
