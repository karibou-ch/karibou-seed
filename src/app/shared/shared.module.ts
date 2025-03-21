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
import { KngProductLinkComponent } from './kng-product-link/kng-product-link.component';
import { KngAudioNoteComponent } from './kng-audio-note/kng-audio-note.component';
import { KngAudioRecorderService } from './kng-audio-recorder.service';
import { KngHomeComponent } from '../kng-home/kng-home.component';
import { KngShopComponent, KngShopsComponent } from '../kng-shops/kng-shops.component';
import { KngAssistantComponent } from './kng-assistant/kng-assistant.component';
import { KngAudioAssistantComponent } from './kng-audio-assistant/kng-audio-assistant.component';
import { KngStreamSentenceComponent } from './kng-stream-sentence/kng-stream-sentence.component';
import { KngBusinessOptionComponent } from './kng-business-option/kng-business-option.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    Kng2CoreModule,
    KngSharedMdcModule,
    KngCommonModule,
    RouterModule.forChild(appRoutes),
  ],
  exports: [
    RouterModule,
    KngCommonModule,
    KngAssistantComponent,
    KngAudioNoteComponent,
    KngAudioAssistantComponent,
    KngBusinessOptionComponent,
    KngControlMessagesComponent,
    KngTextfieldAutosizeDirective,
    KngUserReminderComponent,
    InfiniteScrollerDirective,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    UcWidgetComponent,    
  ],
  declarations: [
    KngAudioNoteComponent,
    KngAudioAssistantComponent,
    KngAssistantComponent,
    KngBusinessOptionComponent,
    KngControlMessagesComponent,
    KngHomeComponent,
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
    KngStreamSentenceComponent,
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
