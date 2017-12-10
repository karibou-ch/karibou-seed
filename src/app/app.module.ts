import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import {HttpClientModule} from '@angular/common/http';


import { AppComponent } from './app.component';
import { NgxStripeModule } from 'ngx-stripe';
import { CoinmarketcapService } from './coinmarketcap.service';
import { ConfigService, Kng2CoreModule } from 'kng2-core';
import { WelcomeComponent } from './welcome/welcome.component';
import { ProductComponent } from './product/product.component';


@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ProductComponent
  ],
  imports: [
    BrowserModule,
    Kng2CoreModule.forRoot({API_SERVER:'http://api.karibou.evaletolab.ch',
        loader:[
          "categories",
          "shops"
        ]
    }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxStripeModule.forRoot('pk_test_oi0sKPJYLGjdvOXOM8tE8cMa'),
  ],
  providers: [CoinmarketcapService],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor(){
    // ConfigService.setDefaultConfig({
    //   API_SERVER:'https://api.karibou.ch',
    //   disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56', /*karibou dev*/
    //   // disqus:'a0602093a94647cd948e95fadb9b9e38'; /*karibou prod*/
    //   mapBoxToken:'pk.eyJ1IjoiZ29uemFsZCIsImEiOiJjajR3cW5ybHQwZ3RrMzJvNXJrOWdkbXk5In0.kMW6xbKtCLEYAEo2_BdMjA'
    // });
    
  }
  
}
