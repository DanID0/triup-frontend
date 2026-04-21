import { Routes } from '@angular/router';
import { Layoutv1 } from './layouts/layoutv1/layoutv1';
import { AuthComponent } from './Pages/auth/auth-component/auth-component';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Layoutv1,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./Pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'workboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./Pages/workboard/workboard/workboard').then((m) => m.Workboard),
      },
    ],
  },

  {
    path: 'board',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./Pages/board/board/board').then((m) => m.Board),
  },

  {
    path: 'b/:token',
    loadComponent: () =>
      import('./Pages/board/guest-board/guest-board').then((m) => m.GuestBoard),
  },

  {
    path: 'login',
    component: AuthComponent,
    canActivate: [guestGuard],
    data: { mode: 'login' },
  },

  {
    path: 'signup',
    component: AuthComponent,
    canActivate: [guestGuard],
    data: { mode: 'signup' },
  },
];
