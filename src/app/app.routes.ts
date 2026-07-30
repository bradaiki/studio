import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then(m => m.LoginPage)
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes)
  },
  {
    path: 'person/:id',
    redirectTo: 'dash/profile/:id',
    pathMatch: 'full'
  },
  {
    path: 'art/:id',
    redirectTo: 'dash/art/:id',
    pathMatch: 'full'
  },
  {
    path: 'art/:id/manage',
    redirectTo: 'dash/art/:id/manage',
    pathMatch: 'full'
  },
  {
    path: 'art-form/:id',
    redirectTo: 'dash/art-form/:id',
    pathMatch: 'full'
  },
];
