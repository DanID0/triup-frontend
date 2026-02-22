import { Routes } from '@angular/router';
import { HomePage } from './Pages/home-page/home-page';
import { Layoutv1 } from './layouts/layoutv1/layoutv1';
import { AuthComponent } from './Pages/auth/auth-component/auth-component';
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
