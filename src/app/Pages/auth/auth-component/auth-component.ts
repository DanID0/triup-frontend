import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../../Services/user.service';
import { getUser } from '../../../store/user-store/user.actions';
import { selectUser } from '../../../store/user-store/user.selectors';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-auth-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<AuthMode>('login');
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isSignup = computed(() => this.mode() === 'signup');
  readonly title = computed(() =>
    this.isSignup() ? 'Create your TaskM account' : 'Welcome back to TaskM',
  );

  username = '';
  email = '';
  password = '';

  ngOnInit(): void {
    const routeMode = this.route.snapshot.data['mode'] as AuthMode | undefined;
    if (routeMode === 'signup' || routeMode === 'login') {
      this.mode.set(routeMode);
    }

    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) this.router.navigate(['/workboard']);
      });
  }

  switchMode(next: AuthMode): void {
    if (this.submitting()) return;
    this.mode.set(next);
    this.errorMessage.set(null);
    this.router.navigate([`/${next}`]);
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.errorMessage.set(null);

    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Email and password are required.');
      return;
    }
    if (this.isSignup() && !this.username.trim()) {
      this.errorMessage.set('Username is required.');
      return;
    }

    this.submitting.set(true);
    try {
      if (this.isSignup()) {
        await this.userService.signup({
          username: this.username.trim(),
          email: this.email.trim(),
          password: this.password,
        });
      }
      await this.userService.login({
        email: this.email.trim(),
        password: this.password,
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
