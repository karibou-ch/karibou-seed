import { LOCALE_ID, NgModule, Injectable, ErrorHandler, NgZone } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';


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
import { ServiceWorkerModule, SwUpdate } from '@angular/service-worker';
import { KngEmptyRootComponent } from './common/kng-empty-root/kng-empty-root.component';


@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private $update: SwUpdate
  ) { }

  extractError(error) {
    // Try to unwrap zone.js error.
    // https://github.com/angular/angular/blob/master/packages/core/src/util/errors.ts
    if (error && error.ngOriginalError) {
      error = error.ngOriginalError;
    }

    // We can handle messages and Error objects directly.
    if (typeof error === "string" || error instanceof Error) {
      return error;
    }

    // If it's http module error, extract as much information from it as we can.
    if (error instanceof HttpErrorResponse) {
      // The `error` property of http exception can be either an `Error` object, which we can use directly...
      if (error.error instanceof Error) {
        return error.error;
      }

      // ... or an`ErrorEvent`, which can provide us with the message but no stack...
      if (error.error instanceof ErrorEvent) {
        return error.error.message;
      }

      // ...or the request body itself, which we can use as a message instead.
      if (typeof error.error === "string") {
        return `Server returned code ${error.status} with body "${error.error}"`;
      }

      // If we don't have any detailed information, fallback to the request message itself.
      return error.message;
    }

    // Skip if there's no error, and let user decide what to do with it.
    return null;
  }

  handleError(error) {
    //
    // Page after new build deploy to load new chunks everything works fine,
    // all we need to either show a popup message to user and ask him to reload
    // page or we programmatically force app to reload if chunks failed error occurs.
    // https://medium.com/@kamrankhatti/angular-lazy-routes-loading-chunk-failed-42b16c22a377
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;

    //
    // Clear cache and Reload App is enough
    // For PWA, reload is not enough, activeUpdate is mandatory
    if (!!chunkFailedMessage.test(error.message)) {      
         
      try{ caches.keys().then(keys => keys.forEach(c=>caches.delete(c))); } catch(err){}
      
      return this.$update.checkForUpdate().then((available)=>{
        this.$update.activateUpdate().then(() => document.location.reload(true));
      });      
    }

    //
    // LAZY LOADIN SENTRY
    import('./sentry/sentry.module').then(m => {
      const Sentry = window['Sentry'];
      const extractedError = this.extractError(error) || "Handled unknown error";
      //
      // IMPORTANT: Rethrow the error otherwise it gets swallowed
      // if (error.statusText === 'Unknown Error' ||
      //     error.rejection && error.rejection.status === 0) {
      //   console.log('--- Network error');
      //   window.location.href = '/oops';
      //   return m.SentryModule;
      // }

      //
      // POST ERROR
      if (environment.production &&
          window.location.origin.indexOf('evaletolab.ch') === -1 &&
          window.location.origin.indexOf('localhost') === -1) {
          Sentry.captureException(extractedError);
      }


      return m.SentryModule;
    });

    //
    // 
    // this.$zone.run(() =>{

    // });


    throw error;
  }
}


@NgModule({
  declarations: [
    AppComponent,
    KngNavbarComponent,
    KngEmptyRootComponent,
    KngRootComponent,
    KngWelcomeComponent,
    KngValidateMailComponent,
    KngServerErrorFoundComponent,
    KngPageNotFoundComponent,
  ],
  // List of components that aren't used in templates directly
  entryComponents:[
  ],
  exports: [
    Kng2CoreModule,
    KngCommonModule,
    RouterModule
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    Kng2CoreModule.forRoot({
      API_SERVER: environment.API_SERVER,
      loader: [
        'categories'
      ]
    }),
    KngCommonModule.forRoot(),
    RouterModule.forRoot(appRoutes, {
      enableTracing: false,
      scrollPositionRestoration: 'disabled'
    }),
    ServiceWorkerModule.register('ngsw-worker.js', { 
      enabled: environment.production
    })
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler},
    { provide: RouteReuseStrategy, useClass: CacheRouteReuseStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
