import { Component } from '@angular/core';
import { UserService } from '../../../Services/user.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../../core/interface';
import { getUser } from '../../../store/user-store/user.actions';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectUser } from '../../../store/user-store/user.selectors';

@Component({
  selector: 'app-auth-component',
  imports: [FormsModule],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent {
  user: User | null = null;
  private userSubscription!: Subscription;
  password = '';
  email = '';
  username = '';
  constructor(private userService: UserService, private router: Router, private store: Store) {}

  async login() {
    await this.userService.login(this.username, this.password, this.email);
    this.store.dispatch(getUser());
  }
  ngOnInit(): void {
    this.userSubscription = this.store.select(selectUser).subscribe((user) => {
      if (user) {
        this.router.navigate(['/workboard']);
      }
    });
  }

}
