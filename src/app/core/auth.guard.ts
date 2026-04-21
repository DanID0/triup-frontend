import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../Services/user.service';
import { getUserSuccess } from '../store/user-store/user.actions';
import { selectUser } from '../store/user-store/user.selectors';

export const authGuard: CanActivateFn = async () => {
  const store = inject(Store);
  const router = inject(Router);
  const userService = inject(UserService);

  const currentUser = await firstValueFrom(store.select(selectUser));
  if (currentUser) return true;

  try {
    const user = await userService.getUser();
    store.dispatch(getUserSuccess({ user }));
    return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
};

export const guestGuard: CanActivateFn = async () => {
  const store = inject(Store);
  const router = inject(Router);
  const userService = inject(UserService);

  const currentUser = await firstValueFrom(store.select(selectUser));
  if (currentUser) return router.createUrlTree(['/workboard']);

  try {
    const user = await userService.getUser();
    store.dispatch(getUserSuccess({ user }));
    return router.createUrlTree(['/workboard']);
  } catch {
    return true;
  }
};
