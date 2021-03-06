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
import { KngUtils } from './utils';
import { KngNavMarketplaceComponent } from '../kng-nav-marketplace/kng-nav-marketplace.component';
import { KngNavCalendarComponent } from '../kng-nav-calendar/kng-nav-calendar.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    CommonMdcModule
  ],
  exports: [
    CommonMdcModule,
    RouterModule,
    KngNavMarketplaceComponent,
    KngNavCalendarComponent,
    KngFooterComponent,
    KngLazyLoadDirective,
  ],
  declarations: [
    // KngNavbarComponent,
    // KngRootComponent,
    KngNavMarketplaceComponent,
    KngNavCalendarComponent,
    KngFooterComponent,
    KngLazyLoadDirective,
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
        IsAuthenticatedGard,
        IsWelcomeGard
      ]
    };
  }
}

