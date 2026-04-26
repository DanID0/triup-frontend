import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../../Services/user.service';
import { I18nService } from '../../../Services/i18n.service';
import { getUser } from '../../../store/user-store/user.actions';
import { selectUser } from '../../../store/user-store/user.selectors';
import { I18nPipe } from '../../../core/i18n.pipe';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-auth-component',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe, RouterLink],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);

  readonly mode = signal<AuthMode>('login');
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isSignup = computed(() => this.mode() === 'signup');
  readonly title = computed(() =>
    this.isSignup() ? this.i18n.t('accountTitleSignup') : this.i18n.t('accountTitleLogin'),
  );

  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  ngOnInit(): void {
    const routeMode = this.route.snapshot.data['mode'] as AuthMode | undefined;
    if (routeMode === 'signup' || routeMode === 'login') {
      this.mode.set(routeMode);
    }

    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) this.router.navigateByUrl(this.resolveRedirect());
      });
  }

  /**
   * Returns the URL to send the user to after a successful login, taken from
   * the `redirect` query param when present (e.g. shared-link flow). Falls
   * back to `/workboard`. Only same-origin paths are allowed to prevent
   * open-redirect issues.
   */
  private resolveRedirect(): string {
    const target = this.route.snapshot.queryParamMap.get('redirect');
    if (target && target.startsWith('/')) return target;
    return '/workboard';
  }

  switchMode(next: AuthMode): void {
    if (this.submitting()) return;
    this.mode.set(next);
    this.errorMessage.set(null);
    this.password = '';
    this.confirmPassword = '';
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.router.navigate([`/${next}`], {
      queryParams: redirect ? { redirect } : undefined,
    });
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.errorMessage.set(null);

    const email = this.email.trim();
    const password = this.password;
    const username = this.username.trim();
    if (!email || !password) {
      this.errorMessage.set('Email and password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }
    if (password.length < 7) {
      this.errorMessage.set('Password must be at least 7 characters long.');
      return;
    }
    if (this.isSignup() && !username) {
      this.errorMessage.set('Username is required.');
      return;
    }
    if (this.isSignup() && username.length < 3) {
      this.errorMessage.set('Username must be at least 3 characters long.');
      return;
    }
    if (this.isSignup() && this.confirmPassword !== password) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    try {
      if (this.isSignup()) {
        await this.userService.signup({
          username,
          email,
          password,
        });
      }
      await this.userService.login({
        email,
        password,
      });
      this.store.dispatch(getUser());
    } catch (err) {
      this.errorMessage.set(this.extractError(err));
    } finally {
      this.submitting.set(false);
    }
  }

  private extractError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Could not reach the server. Is it running?';
      const body = err.error as { message?: string | string[] } | null;
      if (body?.message) {
        return Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
      if (err.status === 401) return 'Invalid credentials.';
      if (err.status === 409) return 'That email or username is already taken.';
      return `Request failed (${err.status}).`;
    }
    return 'Something went wrong. Please try again.';
  }
}
