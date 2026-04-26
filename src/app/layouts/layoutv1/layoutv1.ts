import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18nPipe } from '../../core/i18n.pipe';

import { selectUser } from '../../store/user-store/user.selectors';
import { getUser, logOut } from '../../store/user-store/user.actions';
import { User } from '../../core/interface';
import { I18nService } from '../../Services/i18n.service';
import { ThemeService } from '../../Services/theme.service';

@Component({
  selector: 'app-layoutv1',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, I18nPipe],
  templateUrl: './layoutv1.html',
  styleUrl: './layoutv1.css',
})
export class Layoutv1 implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);

  userProfileData: User | null = null;
  isLoggedIn = false;

  ngOnInit(): void {
    this.store.dispatch(getUser());

    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.userProfileData = user;
        this.isLoggedIn = !!user;
        this.i18n.setFromInterfaceLanguage(user?.interfaceLanguage);
      });
  }

  onLogout(): void {
    this.store.dispatch(logOut());
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleLanguage(): void {
    this.i18n.setLanguage(this.i18n.lang() === 'lv' ? 'en' : 'lv');
  }
}
