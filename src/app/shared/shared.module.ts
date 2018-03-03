import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

//
// exported components and directives
import { ControlMessagesComponent } from './control-messages/control-messages.component';
import { MdcSearchBarComponent } from './mdc-search-bar/mdc-search-bar.component';
import { CoinmarketcapService } from './coinmarketcap.service';
import { NavigationService } from './navigation.service';
import { InfiniteScrollerDirective } from './infinite-scroller.directive';
import { IsAuthenticatedGard } from './is-authenticated-gard.service';
import { i18n } from './i18n.service';


@NgModule({
  imports: [
    CommonModule
  ],
  exports:[
    ControlMessagesComponent,
    InfiniteScrollerDirective,
    MdcSearchBarComponent    
  ],
  declarations: [
    ControlMessagesComponent,
    InfiniteScrollerDirective,
    MdcSearchBarComponent,    
  ],
})
export class SharedModule { 
  public static forRoot(options?:any): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        CoinmarketcapService,
        i18n,
        IsAuthenticatedGard,
        NavigationService
      ]
    }        
  }
}
