import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule , CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';


import { AppComponent } from './app.component';
import { CoinmarketcapService } from './coinmarketcap.service';
import { Kng2CoreModule } from 'kng2-core';
import { WelcomeComponent } from './kng-welcome/welcome.component';
import { KngNavbarComponent } from './kng-navbar/kng-navbar.component';

//
// importing material components
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MdcButtonModule,
  MdcCardModule,
  MdcDrawerModule,
  MdcFabModule,
  MdcIconModule,
  MdcIconToggleModule,  
  MdcListModule,
  MdcMaterialIconModule,
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
import { UserSignComponent, UserRegisterComponent } from './kng-user';
import { ProductComponent, 
         ProductThumbnailComponent, 
         ProductTinyComponent, 
         ProductListComponent } from './kng-product';
import { MdcSearchBarComponent } from './mdc-search-bar/mdc-search-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ProductComponent, ProductThumbnailComponent, ProductTinyComponent, ProductListComponent,
    KngNavbarComponent,
    UserSignComponent, UserRegisterComponent, MdcSearchBarComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    //MatButtonModule, MatCardModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatIconModule, MatMenuModule, MatToolbarModule,
    MdcButtonModule,
    MdcCardModule,
    MdcDrawerModule,
    MdcFabModule,
    MdcIconModule,
    MdcMaterialIconModule,
    MdcIconToggleModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcTextFieldModule,
    MdcTabModule,
    MdcThemeModule,
    MdcToolbarModule,
    Kng2CoreModule.forRoot({API_SERVER:'http://api.karibou.ch',
        loader:[
          "categories"
        ]
    }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes)    
  ],
  providers: [CoinmarketcapService],
  bootstrap: [AppComponent]
})
export class AppModule {}
