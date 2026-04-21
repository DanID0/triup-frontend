import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

import { userReducer } from './store/user-store/user.reducers';
import { UserEffects } from './store/user-store/user.effects';

import { taskReducer } from './store/task-store/task.reducers';
import { TaskEffects } from './store/task-store/task.effects';

import { workspaceReducer } from './store/workspace-store/workspace.reducers';
import { WorkspaceEffects } from './store/workspace-store/workspace.effects';

import { boardReducer } from './store/board-store/board.reducers';
import { BoardEffects } from './store/board-store/board.effects';

import { columnReducer } from './store/column-store/column.reducers';
import { ColumnEffects } from './store/column-store/column.effects';

import { commentReducer } from './store/comment-store/comment.reducers';
import { CommentEffects } from './store/comment-store/comment.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      user: userReducer,
      tasks: taskReducer,
      workspaces: workspaceReducer,
      boards: boardReducer,
      columns: columnReducer,
      comments: commentReducer,
    }),
    provideEffects(
      UserEffects,
      TaskEffects,
      WorkspaceEffects,
      BoardEffects,
      ColumnEffects,
      CommentEffects,
    ),
  ],
};
