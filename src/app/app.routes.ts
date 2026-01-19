import { Routes } from '@angular/router';
import { HomePage } from './Pages/home-page/home-page';

export const routes: Routes = [
    //Kogda zdelajesh layout ispolzuj eto kak example
    //path: '', (path ostavj pustim)
    //component: LayoutPageComponent ( ili kak tam  ego nazavu),
    //children: [ ( sjuda vstavlaj vse komponenti gde etot samij layout budet usaca)
    {
        path: '',
        loadComponent: () =>
          import('./Pages/home-page/home-page').then(
            (m) => m.HomePage
          ),
      },
];
