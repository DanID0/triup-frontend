import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { UserService } from '../../Services/user.service';
import { getUser, getUserSuccess, getUserFailure, logOut, logOutSuccess } from './user.actions';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);

  getUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getUser),
      switchMap(() =>
        from(this.userService.getUser()).pipe(
          map((user) => getUserSuccess({ user })),
          catchError((error) => of(getUserFailure({ error: error.message })))
        )
      )
    )
  );

  logOut$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logOut),
      switchMap(() =>
        from(this.userService.logOut()).pipe(
          map(() => logOutSuccess()),
          catchError((error) => of(getUserFailure({ error: error.message })))
        )
      )
    )
  );
}
