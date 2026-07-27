import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { Amplify } from 'aws-amplify';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { amplifyConfiguration, config } from './app/config/amplify.config';

// Standard Amplify configuration — no custom token storage.
// Tokens are stored in localStorage by default (Amplify's built-in behavior).
Amplify.configure(amplifyConfiguration, {
  ssr: false
});

console.log('Amplify configured');
config.logConfig();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(
      TranslateModule.forRoot()
    ),
    provideTranslateHttpLoader()
  ],
});
