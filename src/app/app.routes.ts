import { Routes } from '@angular/router';
import { HomePage } from './Pages/home-page/home-page';
import { Layoutv1 } from './layouts/layoutv1/layoutv1';
import { AuthComponent } from './Pages/auth/auth-component/auth-component';
import { Workboard } from './Pages/workboard/workboard/workboard';
import { Board } from './Pages/board/board/board';
export const routes: Routes = [
    //Kogda zdelajesh layout ispolzuj eto kak example
    //path: '', (path ostavj pustim)
    //component: LayoutPageComponent ( ili kak tam  ego nazavu),
    //children: [ ( sjuda vstavlaj vse komponenti gde etot samij layout budet usaca)

    {
      path: '',
      component: Layoutv1,
      children: [
        {
          path: '',
          loadComponent: () =>
            import('./Pages/home-page/home-page').then(
              (m) => m.HomePage
            ),
        },
        {
          path: 'workboard',
          loadComponent: () =>
            import('./Pages/workboard/workboard/workboard').then(
              (m) => m.Workboard
            ),
        },
        {
          path: 'board',
          loadComponent: () =>
            import('./Pages/board/board/board').then(
              (m) => m.Board
            ),
        }
      ]
    },

    { 
      path: 'login', 
      component: AuthComponent,
       data: 
       { 
        mode: 'login' 
      } 
      },

    { 
      path: 'signup',
       component: AuthComponent, 
       data: { 
        mode: 'signup' 
      }
     },

];
