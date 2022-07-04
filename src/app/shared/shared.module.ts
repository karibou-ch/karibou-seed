import { NgModule, ModuleWithProviders } from '@angular/core';

//
// exported components and directives
import { KngControlMessagesComponent } from './kng-control-messages/control-messages.component';
import { InfiniteScrollerDirective } from './infinite-scroller.directive';
import { KngMailConfirmationComponent } from './kng-mail-confirmation/kng-mail-confirmation.component';
import { KngTextfieldAutosizeDirective } from './kng-textfield-autosize.directive';

//
// that should be in a specific admin module
import { UcWidgetComponent } from './kng-uc-widget/uc-widget';

import { KngUiBottomActionsComponent } from './kng-ui-bottom-actions/kng-ui-bottom-actions.component';
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

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KngFeedbackComponent } from './kng-feedback/kng-feedback.component';

import { appRoutes } from './shared.routes';
import { NgxStripeModule } from 'ngx-stripe';
import { KngProductLinkComponent } from './kng-product-link/kng-product-link.component';
import { KngAudioNoteComponent } from './kng-audio-note/kng-audio-note.component';
import { KngAudioRecorderService } from './kng-audio-recorder.service';
import { KngHomeComponent } from '../kng-home/kng-home.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    KngFeedbackComponent,
    KngMailConfirmationComponent,
    KngTextfieldAutosizeDirective,
    KngUserReminderComponent,
    KngUiBottomActionsComponent,
    InfiniteScrollerDirective,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    UcWidgetComponent,
  ],
  declarations: [
    KngAudioNoteComponent,
    KngHomeComponent,
    KngControlMessagesComponent,
    KngTextfieldAutosizeDirective,
    KngMailConfirmationComponent,
    InfiniteScrollerDirective,
    KngUiBottomActionsComponent,
    KngUserReminderComponent,
    UcWidgetComponent,
    ProductComponent,
    ProductTinyComponent,
    ProductListComponent,
    KngProductListByShopComponent,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    KngFeedbackComponent,
    KngProductLinkComponent
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
