import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { UserService } from '../Services/user.service';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<boolean | null>(null);

const shouldSkip = (req: HttpRequest<unknown>): boolean =>
  req.url.includes('/auth/login') ||
  req.url.includes('/auth/refresh') ||
  req.url.includes('/auth/logout') ||
  (req.method === 'POST' && req.url.endsWith('/user'));

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const router = inject(Router);

  const withCreds = req.clone({ withCredentials: true });

  return next(withCreds).pipe(
    catchError((err: unknown): Observable<HttpEvent<unknown>> => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || shouldSkip(req)) {
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshDone$.pipe(
          filter((v): v is boolean => v !== null),
          take(1),
          switchMap((ok) => (ok ? next(withCreds) : throwError(() => err))),
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return userService.refresh().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshDone$.next(true);
          return next(withCreds);
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          refreshDone$.next(false);
          if (!req.url.endsWith('/user/profile')) {
            router.navigate(['/login']);
          }
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
