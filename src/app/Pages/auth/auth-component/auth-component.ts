import { Component } from '@angular/core';
import { UserService } from '../../../Services/user.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-auth-component',
  imports: [FormsModule],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent {
  password = '';
  email = '';
  username = '';
  constructor(private userService: UserService) {}

  async login() {
    await this.userService.login(this.username, this.password, this.email);

  }
}
