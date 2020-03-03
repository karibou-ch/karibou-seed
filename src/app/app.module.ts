import { LOCALE_ID, NgModule, Injectable, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';


import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
//
// the second parameter 'fr' is optional
registerLocaleData(localeFr, 'fr');

//
// app modules
import { Kng2CoreModule  } from 'kng2-core';
import { KngCommonModule } from './common/common.module';

//
// App components
import { AppComponent } from './app.component';
import { KngNavbarComponent } from './kng-navbar';

//
// environnement
import { environment } from '../environments/environment';

//
// routing
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { appRoutes } from './app.routes';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngValidateMailComponent } from './kng-validate-mail/kng-validate-mail.component';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';
import { KngRootComponent } from './kng-root/kng-root.component';
import { CacheRouteReuseStrategy } from './app.cache.route';
//import { ServiceWorkerModule } from '@angular/service-worker';

// Sentry bundle size
// https://github.com/getsentry/sentry-javascript/issues/1552
import * as Sentry from '@sentry/browser';
import { version } from '../../package.json';


//
// FIXME use chunk js module to load Sentry (50kb) only on demand
window['Sentry'] = window['Sentry'] || Sentry;
Sentry.init({
  dsn: 'https://9457c6b1c4e343b8b1aa7e74642147e0@sentry.io/1360987',
  release: version
});

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error) {
    //
    // Page after new build deploy to load new chunks everything works fine,
    // all we need to either show a popup message to user and ask him to reload
    // page or we programmatically force app to reload if chunks failed error occurs.
    // https://medium.com/@kamrankhatti/angular-lazy-routes-loading-chunk-failed-42b16c22a377
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;

    if (chunkFailedMessage.test(error.message)) {
      window.location.reload();
    }

    //
    // IMPORTANT: Rethrow the error otherwise it gets swallowed
    if (error.statusText === 'Unknown Error' ||
        error.rejection && error.rejection.status === 0) {
      console.log('--- Network error');
      window.location.href = '/oops';
      throw error;
    }
    if (!environment.production ||
        window.location.origin.indexOf('karibou.ch') === -1) {
      throw error;
    }

    //
    // USING SENTRY AS DEBUG
    Sentry.captureException(error.originalError || error);
    throw error;
  }
}


@NgModule({
  declarations: [
    AppComponent,
    KngNavbarComponent,
    KngRootComponent,
    KngWelcomeComponent,
    KngValidateMailComponent,
    KngServerErrorFoundComponent,
    KngPageNotFoundComponent
  ],
  exports:[
    Kng2CoreModule,
    KngCommonModule
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    Kng2CoreModule.forRoot({
      API_SERVER: environment.API_SERVER,
      loader: [
        'categories',
        'shops'
      ]
    }),
    KngCommonModule.forRoot(),
    RouterModule.forRoot(appRoutes, {
      enableTracing: false,
      scrollPositionRestoration: 'disabled'
    }),
    //ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler},
    { provide: RouteReuseStrategy, useClass: CacheRouteReuseStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
