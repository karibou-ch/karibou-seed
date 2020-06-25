import { LOCALE_ID, NgModule, Injectable, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';


import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
//
// the second parameter 'fr' is optional
registerLocaleData(localeFr, 'fr');

//
// app modules

import { MdcModule } from './app.mdc.module';
//import { Material2Module } from './app.material2.module';

//
// App components
import { AppComponent } from './app.component';

//
// App directives

//
// environnement
import { environment } from '../environments/environment';

//
// routing
import { RouterModule, Routes, Router } from '@angular/router';
import { appRoutes } from './app.routes';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';
import { KngFooterComponent } from './shared/kng-footer/kng-footer.component';

import { InfiniteScrollerDirective } from './shared/infinite-scroller.directive';
import { i18n, KngNavigationStateService } from './shared';
import { Kng2CoreModule, ConfigService } from 'kng2-core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error) {
     // IMPORTANT: Rethrow the error otherwise it gets swallowed
     if(error.rejection&&error.rejection.status==0){
      
       window.location.href='/oops';
     }
     throw error;
  } 
}


@NgModule({
  declarations: [
    AppComponent,
    KngFooterComponent,
    KngWelcomeComponent,
    KngServerErrorFoundComponent,
    KngPageNotFoundComponent,
    InfiniteScrollerDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
    MdcModule,
    // Kng2CoreModule.forRoot({
    //   API_SERVER:environment.API_SERVER,
    //   loader:[
    //     "categories",
    //     "shops"
    //   ]
    // }),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    i18n, KngNavigationStateService
    // { provide: ErrorHandler, useClass: GlobalErrorHandler}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

