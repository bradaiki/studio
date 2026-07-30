import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'dash',
    component: TabsPage,
    children: [
      {
        path: 'arts',
        loadComponent: () =>
          import('../arts/arts.page').then((m) => m.ArtsPage),
      },
      {
        path: 'studios',
        loadComponent: () =>
          import('../studios-list/studios-list.page').then((m) => m.StudiosListPage),
      },
      {
        path: 'studio/:id',
        loadComponent: () =>
          import('../studio/studio.page').then((m) => m.StudioPage),
      },
      {
        path: 'studio/:id/manage',
        loadComponent: () =>
          import('../studio-management/studio-management.page').then((m) => m.StudioManagementPage),
      },
      {
        path: 'studio-form',
        loadComponent: () =>
          import('../studio-form/studio-form.page').then((m) => m.StudioFormPage),
      },
      {
        path: 'people',
        loadComponent: () =>
          import('../people/people.page').then((m) => m.PeoplePage),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('../events/events.page').then((m) => m.EventsPage),
      },
      {
        path: 'orgs',
        loadComponent: () =>
          import('../orgs/orgs.page').then((m) => m.OrgsPage),
      },
      {
        path: 'feed',
        loadComponent: () =>
          import('../feed/feed.page').then((m) => m.FeedPage),
      },
      {
        path: 'post-form',
        loadComponent: () =>
          import('../post-form/post-form.page').then((m) => m.PostFormPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('../profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'person/:id',
        redirectTo: 'profile/:id',
        pathMatch: 'full'
      },
      {
        path: 'orgs',
        loadComponent: () =>
          import('../orgs/orgs.page').then((m) => m.OrgsPage),
      },
      {
        path: 'org/:id',
        loadComponent: () =>
          import('../org/org.page').then((m) => m.OrgPage),
      },

      {
        path: 'event/:id',
        loadComponent: () =>
          import('../event/event.page').then((m) => m.EventPage),
      },
      {
        path: 'art/:id',
        loadComponent: () =>
          import('../art/art.page').then((m) => m.ArtPage),
      },
      {
        path: 'art/:id/manage',
        loadComponent: () =>
          import('../art-management/art-management.page').then((m) => m.ArtManagementPage),
      },
      {
        path: 'art-form/:id',
        loadComponent: () =>
          import('../art-form/art-form.page').then((m) => m.ArtFormPage),
      },
      {
        path: 'activity/:id',
        loadComponent: () =>
          import('../activity/activity.page').then((m) => m.ActivityPage),
      },

      {
        path: 'org-form/:id',
        loadComponent: () =>
          import('../org-form/org-form.page').then((m) => m.OrgFormPage),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('../chat/chat.page').then((m) => m.ChatPage),
      },
      {
        path: 'chat/:id',
        loadComponent: () =>
          import('../chat/chat.page').then((m) => m.ChatPage),
      },
      {
        path: '',
        redirectTo: 'feed',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'dash/feed',
    pathMatch: 'full',
  },
];
