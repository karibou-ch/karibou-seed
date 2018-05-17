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
import { Kng2CoreModule  } from 'kng2-core';
import { SharedModule } from './shared/shared.module';

import { MdcModule } from './app.mdc.module';
//import { Material2Module } from './app.material2.module';

//
// App components
import { AppComponent } from './app.component';
import { KngDepartementComponent } from './kng-departement/departement.component';
import { KngNavbarComponent } from './kng-navbar';

//
// App directives

//
// environnement
import { environment } from '../environments/environment';

//
// routing
import { RouterModule, Routes } from '@angular/router';
import { appRoutes } from './app.routes';
import { ProductComponent, 
         ProductThumbnailComponent, 
         ProductTinyComponent, 
         ProductListComponent } from './kng-product';
import { KngHomeComponent } from './kng-home/kng-home.component';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngValidateMailComponent } from './kng-validate-mail/kng-validate-mail.component';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error) {
     // IMPORTANT: Rethrow the error otherwise it gets swallowed
     throw error;
  } 
}


@NgModule({
  declarations: [
    AppComponent,
    KngDepartementComponent,
    ProductComponent, ProductThumbnailComponent, ProductTinyComponent, ProductListComponent,
    KngNavbarComponent,
    KngHomeComponent,
    KngWelcomeComponent,
    KngValidateMailComponent    
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
    MdcModule,
    Kng2CoreModule.forRoot({
      API_SERVER:environment.API_SERVER,
      loader:[
        "categories",
        "shops"
      ]
    }),
    SharedModule.forRoot(),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

