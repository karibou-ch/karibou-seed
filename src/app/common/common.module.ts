import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

//
// exported components and directives
import { KngFooterComponent } from './kng-footer/kng-footer.component';
import { KngNavigationStateService } from './navigation.service';
import { IsAuthenticatedGard,
         IsWelcomeGard } from './is-authenticated-gard.service';
import { i18n } from './i18n.service';
import { MetricsService } from './metrics.service';

import { KngHttpInterceptorService } from './kng-http-interceptor.service';

import { CommonMdcModule } from './common.mdc.module';

import { KngLazyLoadDirective } from './kng-lazy-load.directive';

import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { KngNavigationStoreResolve } from './navigation.store.service';
import { KngUtils, KngSafeHtmlPipe } from './utils';
import { KngNavMarketplaceComponent } from '../kng-nav-marketplace/kng-nav-marketplace.component';
import { KngNavCalendarComponent } from '../kng-nav-calendar/kng-nav-calendar.component';
import { KngCalendarComponent } from './kng-calendar/kng-calendar.component';
import { KngUiBottomActionsComponent } from '../shared/kng-ui-bottom-actions/kng-ui-bottom-actions.component';
import { KngSearchBarComponent, KngSearchComponent } from '../shared';
import { KngNewsComponent } from './kng-news/kng-news.component';
import { KngFeedbackComponent } from '../shared/kng-feedback/kng-feedback.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KngMailConfirmationComponent } from './kng-mail-confirmation/kng-mail-confirmation.component';
import { KngSubscriptionOptionComponent } from './kng-subscription-option/kng-subscription-option.component';
import { KngRippleDirective } from './kng-ripple.directive';
import { NgxStripeModule } from 'ngx-stripe';
import { KngAddressComponent } from './kng-address/kng-address.component';
import { KngPaymentComponent } from './kng-payment/kng-user-payment.component';
import { KngSubsciptionControlComponent } from './kng-subsciption-control/kng-subsciption-control.component';
import { KngSignupComponent } from './kng-signup/kng-signup.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgxStripeModule.forRoot(),
    CommonMdcModule
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    CommonMdcModule,
    RouterModule,
    KngSubsciptionControlComponent,
    KngPaymentComponent,
    KngAddressComponent,
    KngUiBottomActionsComponent,
    KngSignupComponent,
    KngSearchComponent,
    KngSearchBarComponent,
    KngNavMarketplaceComponent,
    KngNavCalendarComponent,
    KngMailConfirmationComponent,
    KngCalendarComponent,
    KngFooterComponent,
    KngLazyLoadDirective,
    KngNewsComponent,
    KngSafeHtmlPipe,
    KngFeedbackComponent,
    KngSubscriptionOptionComponent,
    KngRippleDirective
  ],
  declarations: [
    KngSubsciptionControlComponent,
    KngPaymentComponent,
    KngAddressComponent,
    KngUiBottomActionsComponent,
    KngSignupComponent,
    KngSearchComponent,
    KngSearchBarComponent,
    KngNavMarketplaceComponent,
    KngNavCalendarComponent,
    KngMailConfirmationComponent,
    KngFooterComponent,
    KngLazyLoadDirective,
    KngCalendarComponent,
    KngNewsComponent,
    KngSafeHtmlPipe,
    KngFeedbackComponent,
    KngSubscriptionOptionComponent,
    KngRippleDirective
  ],
})
export class KngCommonModule {
  public static forRoot(options?: any): ModuleWithProviders<KngCommonModule> {
    return {
      ngModule: KngCommonModule,
      providers: [
      { provide: HTTP_INTERCEPTORS, useClass: KngHttpInterceptorService, multi: true },
        MetricsService,
        i18n,
        KngNavigationStateService,
        KngNavigationStoreResolve,
        KngUtils,
        KngSafeHtmlPipe,
        IsAuthenticatedGard,
        IsWelcomeGard
      ]
    };
  }
}

