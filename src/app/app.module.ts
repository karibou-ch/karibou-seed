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
import { EnumMetrics } from './common/metrics.service';
import { CacheRouteReuseStrategy } from './app.cache.route';
import { ServiceWorkerModule } from '@angular/service-worker';
// import { ServiceWorkerModule } from '@angular/service-worker';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error) {
     // IMPORTANT: Rethrow the error otherwise it gets swallowed
     if (error.rejection && error.rejection.status === 0) {
       console.log('--- Network error');
       window.location.href = '/oops';
       throw error;
     }
     //
     // USING SENTRY AS DEBUG
     try {
      console.log('origin', window.location.origin);
      if (window.location.origin.indexOf('karibou.ch') === -1) {
        console.debug('LOCALHOST ERROR----', error.originalError || error);
        return ;
      }
      console.log('ERROR----', error.originalError || error);
      console.log('ERROR----', (error.originalError || error).message);
      (<any>window).Sentry && (<any>window).Sentry.captureException(error.originalError || error);
     } catch (e) {

     }

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
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    // ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler},
    { provide: RouteReuseStrategy, useClass: CacheRouteReuseStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}