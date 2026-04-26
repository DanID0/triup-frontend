import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nPipe } from '../../core/i18n.pipe';

@Component({
  selector: 'app-home-page',
  imports: [I18nPipe, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {

}
