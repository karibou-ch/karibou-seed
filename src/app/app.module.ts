import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';


import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
//
// the second parameter 'fr' is optional
registerLocaleData(localeFr, 'fr');

import { Kng2CoreModule  } from 'kng2-core';

//
// App components
import { AppComponent } from './app.component';
import { CoinmarketcapService } from './coinmarketcap.service';
import { KngDepartementComponent } from './kng-departement/departement.component';
import { KngNavbarComponent, KngNavigationService } from './kng-navbar';

//
// App directives
import { InfiniteScrollerDirective } from './infinite-scroller.directive';

//
// importing material components
import {
  MdcButtonModule,
  MdcCardModule,
  MdcDrawerModule,
  MdcDialogModule,
  MdcElevationModule,
  MdcFabModule,
  MdcIconModule,
  MdcIconToggleModule,  
  MdcListModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcTabModule,
  MdcThemeModule,
  MdcTextFieldModule,
  MdcToolbarModule
} from '@angular-mdc/web';

// import { MatButtonModule,
//          MatCardModule,
//          MatGridListModule,
//          MatFormFieldModule,  
//          MatInputModule,
//          MatIconModule, 
//          MatMenuModule,
//          MatToolbarModule } from '@angular/material';


//
// routing
import { RouterModule, Routes } from '@angular/router';
import { appRoutes } from './app.routes';
import { ProductComponent, 
         ProductThumbnailComponent, 
         ProductTinyComponent, 
         ProductListComponent } from './kng-product';
import { MdcSearchBarComponent } from './mdc-search-bar/mdc-search-bar.component';
import { KngHomeComponent } from './kng-home/kng-home.component';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngCartComponent } from './kng-cart/kng-cart.component';

@NgModule({
  declarations: [
    AppComponent,
    KngDepartementComponent,
    ProductComponent, ProductThumbnailComponent, ProductTinyComponent, ProductListComponent,
    KngNavbarComponent,
    MdcSearchBarComponent, KngHomeComponent,
    InfiniteScrollerDirective,
    KngWelcomeComponent,
    KngCartComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    //MatButtonModule, MatCardModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatIconModule, MatMenuModule, MatToolbarModule,
    MdcButtonModule,
    MdcCardModule,
    MdcDrawerModule,
    MdcDialogModule,
    MdcElevationModule,
    MdcFabModule,
    MdcIconModule,
    MdcIconToggleModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcTextFieldModule,
    MdcTabModule,
    MdcThemeModule,
    MdcToolbarModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
    Kng2CoreModule.forRoot({
      API_SERVER:'http://api.beta.boulangerie-bretzel.ch',
      loader:[
        "categories"
      ]
    }),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    CoinmarketcapService,
    KngNavigationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
