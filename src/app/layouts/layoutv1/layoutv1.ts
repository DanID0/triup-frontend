import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { selectUser } from '../../store/user-store/user.selectors';
import { getUser, logOut } from '../../store/user-store/user.actions';
import { User } from '../../core/interface';

@Component({
  selector: 'app-layoutv1',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './layoutv1.html',
  styleUrl: './layoutv1.css',
})
export class Layoutv1 implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

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
      });
  }

  onLogout(): void {
    this.store.dispatch(logOut());
  }
}
