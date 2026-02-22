import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectUser } from '../../store/user-store/user.selectors';
import { getUser } from '../../store/user-store/user.actions';
import { User } from '../../core/interface';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-layoutv1',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './layoutv1.html',
  styleUrl: './layoutv1.css',
})
export class Layoutv1 implements OnInit, OnDestroy {
  userProfileData: User | null = null;
  isLoggedIn = false;
  private userSubscription!: Subscription;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(getUser());

    this.userSubscription = this.store.select(selectUser).subscribe((user) => {
      if (user) {
        this.userProfileData = user;
        this.isLoggedIn = true;
      } else {
        this.userProfileData = null;
        this.isLoggedIn = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
}
