import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Language, User } from '../../../core/interface';
import { I18nPipe } from '../../../core/i18n.pipe';
import { UserService } from '../../../Services/user.service';
import { UploadService } from '../../../Services/upload.service';
import { I18nService } from '../../../Services/i18n.service';
import { updateUser } from '../../../store/user-store/user.actions';
import { selectUser } from '../../../store/user-store/user.selectors';

@Component({
  selector: 'app-manage-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, I18nPipe],
  templateUrl: './manage-profile.html',
  styleUrl: './manage-profile.css',
})
export class ManageProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly uploadService = inject(UploadService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);

  @ViewChild('avatarInput') avatarInput?: ElementRef<HTMLInputElement>;

  readonly user = signal<User | null>(null);
  readonly avatarMenuOpen = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  username = '';
  email = '';
  password = '';
  oldPassword = '';
  interfaceLanguage: Language = Language.LATVIAN;

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u) => {
        this.user.set(u);
        if (!u) {
          this.router.navigateByUrl('/login');
          return;
        }
        this.username = u.username ?? '';
        this.email = u.email ?? '';
        this.interfaceLanguage = u.interfaceLanguage ?? Language.LATVIAN;
        this.i18n.setFromInterfaceLanguage(this.interfaceLanguage);
      });
  }

  avatarSrc(): string | null {
    const avatar = this.user()?.avatarUrl;
    return this.uploadService.absoluteUrl(avatar || '');
  }

  avatarInitial(): string {
    return (this.user()?.username || '?').charAt(0).toUpperCase();
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);
    this.success.set(null);
    try {
      const uploaded = await this.uploadService.uploadImage(file);
      const updated = await this.userService.updateProfile({ avatarUrl: uploaded.url });
      this.store.dispatch(updateUser({ user: updated }));
      this.success.set('Profile photo updated.');
    } catch {
      this.error.set('Could not upload profile photo.');
    } finally {
      input.value = '';
      this.avatarMenuOpen.set(false);
    }
  }

  async removeAvatar(): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    try {
      const updated = await this.userService.updateProfile({ avatarUrl: null });
      this.store.dispatch(updateUser({ user: updated }));
      this.success.set('Profile photo removed.');
    } catch {
      this.error.set('Could not remove profile photo.');
    } finally {
      this.avatarMenuOpen.set(false);
    }
  }

  openFilePicker(): void {
    this.avatarInput?.nativeElement.click();
  }

  async saveProfile(): Promise<void> {
    if (!this.username.trim() || !this.email.trim()) {
      this.error.set('Username and email are required.');
      return;
    }
    if (this.password.trim() && !this.oldPassword.trim()) {
      this.error.set('Current password is required to set a new password.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      const updated = await this.userService.updateProfile({
        username: this.username.trim(),
        email: this.email.trim(),
        interfaceLanguage: this.interfaceLanguage === Language.ENGLISH ? 'ENGLISH' : 'LATVIAN',
        password: this.password.trim() || undefined,
        oldPassword: this.oldPassword.trim() || undefined,
      });
      this.store.dispatch(updateUser({ user: updated }));
      this.i18n.setFromInterfaceLanguage(updated.interfaceLanguage);
      this.password = '';
      this.oldPassword = '';
      this.success.set('Profile updated successfully.');
    } catch {
      this.error.set('Could not save profile changes.');
    } finally {
      this.saving.set(false);
    }
  }
}
