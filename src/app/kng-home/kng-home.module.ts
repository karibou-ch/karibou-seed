import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Kng2CoreModule } from 'kng2-core';
import { KngSharedModule } from '../shared/shared.module';
import { KngCommonModule } from '../common/common.module';
import { KngHomeComponent } from './kng-home.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './kng-home.routes';

@NgModule({
  imports: [
    CommonModule,
    KngSharedModule,
    Kng2CoreModule,
    KngCommonModule,
    KngSharedModule,
    RouterModule.forChild(appRoutes),
  ],
  exports: [
    KngHomeComponent
  ],
  declarations: [
    KngHomeComponent
  ]
})
export class KngHomeModule {
  public static forRoot(options?: any): ModuleWithProviders<KngHomeModule> {
    return {
      ngModule: KngHomeModule,
    };
  }
}