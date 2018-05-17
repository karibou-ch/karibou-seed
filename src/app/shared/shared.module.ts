import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

//
// exported components and directives
import { KngControlMessagesComponent } from './kng-control-messages/control-messages.component';
import { MdcSearchBarComponent } from './mdc-search-bar/mdc-search-bar.component';
import { CoinmarketcapService } from './coinmarketcap.service';
import { KngNavigationStateService } from './navigation.service';
import { InfiniteScrollerDirective } from './infinite-scroller.directive';
import { IsAuthenticatedGard,
         IsWelcomeGard } from './is-authenticated-gard.service';
import { i18n } from './i18n.service';
import { KngMailConfirmationComponent } from './kng-mail-confirmation/kng-mail-confirmation.component';
import { KngFooterComponent } from './kng-footer/kng-footer.component';
import { KngTextfieldAutosizeDirective } from './kng-textfield-autosize.directive';
import { KngQuickEditorComponent, KngEditorDirective } from './kng-quick-editor/quick-editor.component';

//
// that should be in a specific admin module
import { UcWidgetComponent } from 'ngx-uploadcare-widget';

import {
  MdcIconModule,
  MdcIconToggleModule,
  MdcLinearProgressModule
} from '@angular-mdc/web';

@NgModule({
  imports: [
    CommonModule,
    MdcIconModule,
    MdcIconToggleModule,
    MdcLinearProgressModule
    ],
  exports:[
    KngControlMessagesComponent,
    KngEditorDirective,
    KngFooterComponent,
    KngMailConfirmationComponent,
    InfiniteScrollerDirective,
    MdcSearchBarComponent,
    KngTextfieldAutosizeDirective,
    KngQuickEditorComponent,
    UcWidgetComponent       
  ],
  declarations: [
    KngControlMessagesComponent,
    KngEditorDirective,
    KngFooterComponent,
    KngMailConfirmationComponent,
    InfiniteScrollerDirective,
    MdcSearchBarComponent,
    KngQuickEditorComponent,
    KngTextfieldAutosizeDirective,
    UcWidgetComponent
  ],
})
export class SharedModule { 
  public static forRoot(options?:any): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        CoinmarketcapService,
        i18n,
        KngNavigationStateService,
        IsAuthenticatedGard,
        IsWelcomeGard
      ]
    }        
  }
}
