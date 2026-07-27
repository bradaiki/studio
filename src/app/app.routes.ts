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
    loadComponent: () => import('./art/art.page').then( m => m.ArtPage)
  },
  {
    path: 'art/:id/manage',
    loadComponent: () => import('./art-management/art-management.page').then( m => m.ArtManagementPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'art-form/:id',
    loadComponent: () => import('./art-form/art-form.page').then( m => m.ArtFormPage)
  },
];
