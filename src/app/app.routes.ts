import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
  },
  {
    path: 'exams',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/exams/exam-list/exam-list.component').then((m) => m.ExamListComponent)
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/exams/exam-create/exam-create.component').then((m) => m.ExamCreateComponent)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/exams/exam-detail/exam-detail.component').then((m) => m.ExamDetailComponent)
      },
      {
        path: ':id/take',
        loadComponent: () =>
          import('./features/exams/exam-take/exam-take.component').then((m) => m.ExamTakeComponent)
      },
      {
        path: ':id/results',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/exams/exam-results/exam-results.component').then((m) => m.ExamResultsComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
