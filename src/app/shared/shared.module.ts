import { NgModule, ModuleWithProviders } from '@angular/core';

//
// exported components and directives
import { KngControlMessagesComponent } from './kng-control-messages/control-messages.component';
import { InfiniteScrollerDirective } from './infinite-scroller.directive';
import { KngTextfieldAutosizeDirective } from './kng-textfield-autosize.directive';

//
// that should be in a specific admin module
import { UcWidgetComponent } from './kng-uc-widget/uc-widget';

import { KngUserReminderComponent } from './kng-user-reminder/kng-user-reminder.component';


import { RouterModule } from '@angular/router';
import { KngCommonModule } from '../common/common.module';

import { ProductSwipeComponent,
         ProductListComponent,
         KngProductListByShopComponent,
         ProductGroupedListComponent,
         ProductThumbnailComponent,
         ProductComponent,
         ProductTinyComponent} from '../kng-product';
import { CommonModule } from '@angular/common';
import { Kng2CoreModule } from 'kng2-core';
import { KngSharedMdcModule } from './shared.mdc.module';


import { appRoutes } from './shared.routes';
import { NgxStripeModule } from 'ngx-stripe';
import { KngProductLinkComponent } from './kng-product-link/kng-product-link.component';
import { KngAudioNoteComponent } from './kng-audio-note/kng-audio-note.component';
import { KngAudioRecorderService } from './kng-audio-recorder.service';
import { KngHomeComponent } from '../kng-home/kng-home.component';
import { KngShopComponent, KngShopsComponent } from '../kng-shops/kng-shops.component';
import { KngInvoiceComponent } from './kng-invoice/kng-invoice.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    Kng2CoreModule,
    KngSharedMdcModule,
    KngCommonModule,
    NgxStripeModule.forRoot(),
    RouterModule.forChild(appRoutes),
  ],
  exports: [
    RouterModule,
    KngCommonModule,
    KngAudioNoteComponent,
    KngControlMessagesComponent,
    KngTextfieldAutosizeDirective,
    KngUserReminderComponent,
    InfiniteScrollerDirective,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    UcWidgetComponent,
    KngInvoiceComponent
  ],
  declarations: [
    KngAudioNoteComponent,
    KngHomeComponent,
    KngControlMessagesComponent,
    KngShopComponent,
    KngShopsComponent,
    KngTextfieldAutosizeDirective,
    InfiniteScrollerDirective,
    KngUserReminderComponent,
    UcWidgetComponent,
    ProductComponent,
    ProductTinyComponent,
    ProductListComponent,
    KngProductListByShopComponent,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    KngProductLinkComponent,
    KngInvoiceComponent
  ],
})
export class KngSharedModule {
  public static forRoot(options?: any): ModuleWithProviders<KngSharedModule> {
    return {
      ngModule: KngSharedModule,
      providers: [
        KngAudioRecorderService
      ]
    };
  }
}
