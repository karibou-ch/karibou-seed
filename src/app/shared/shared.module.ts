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
import { KngHomeComponent } from '../kng-home/kng-home.component';

import { ProductSwipeComponent,
         ProductListComponent,
         ProductGroupedListComponent,
         ProductThumbnailComponent,
         ProductComponent,
         ProductTinyComponent} from '../kng-product';
import { CommonModule } from '@angular/common';
import { Kng2CoreModule } from 'kng2-core';
import { KngSharedMdcModule } from './shared.mdc.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdcSearchBarComponent } from './mdc-search-bar/mdc-search-bar.component';
import { KngFeedbackComponent } from './kng-feedback/kng-feedback.component';

import { appRoutes } from './shared.routes';
import { NgxStripeModule } from 'ngx-stripe';
import { KngProductLinkComponent } from './kng-product-link/kng-product-link.component';

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
    KngControlMessagesComponent,
    KngFeedbackComponent,
    KngHomeComponent,
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
    // KngNavbarComponent,
    // KngRootComponent,
    KngHomeComponent,
    KngControlMessagesComponent,
    KngTextfieldAutosizeDirective,
    KngMailConfirmationComponent,
    InfiniteScrollerDirective,
    KngUiBottomActionsComponent,
    KngUserReminderComponent,
    MdcSearchBarComponent,
    UcWidgetComponent,
    ProductComponent,
    ProductTinyComponent,
    ProductListComponent,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    KngFeedbackComponent,
    KngProductLinkComponent
  ],
})
export class SharedModule {
  public static forRoot(options?: any): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [
      ]
    };
  }
}
