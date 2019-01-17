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

import { CommonMdcModule } from './common.mdc.module';

// import {
//   MdcLinearProgressModule,
// } from '@angular-mdc/web';

import { KngLazyLoadDirective } from './kng-lazy-load.directive';

import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    CommonMdcModule
  ],
  exports:[
    CommonMdcModule,
    RouterModule,
    KngFooterComponent,
    KngLazyLoadDirective,
  ],
  declarations: [
    // KngNavbarComponent,
    // KngRootComponent,
    KngFooterComponent,
    KngLazyLoadDirective,
  ],
})
export class KngCommonModule { 
  public static forRoot(options?:any): ModuleWithProviders {
    return {
      ngModule: KngCommonModule,
      providers: [
        MetricsService,
        i18n,
        KngNavigationStateService,
        IsAuthenticatedGard,
        IsWelcomeGard
      ]
    }        
  }
}
