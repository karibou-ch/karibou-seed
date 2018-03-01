import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
// routing
import { RouterModule, Routes } from '@angular/router';
import { appRoutes } from './app.routes';
import { ProductComponent, 
         ProductThumbnailComponent, 
         ProductTinyComponent, 
         ProductListComponent } from './kng-product';
import { KngHomeComponent } from './kng-home/kng-home.component';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngCartComponent } from './kng-cart/kng-cart.component';

@NgModule({
  declarations: [
    AppComponent,
    KngDepartementComponent,
    ProductComponent, ProductThumbnailComponent, ProductTinyComponent, ProductListComponent,
    KngNavbarComponent,
    KngHomeComponent,
    KngWelcomeComponent,
    KngCartComponent    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
    MdcModule,
    SharedModule.forRoot(),
    Kng2CoreModule.forRoot({
      API_SERVER:'http://api.beta.boulangerie-bretzel.ch',
      loader:[
        "categories"
      ]
    }),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
