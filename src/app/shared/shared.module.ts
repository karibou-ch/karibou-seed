import { NgModule, ModuleWithProviders, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { KngSharedComponentsModule } from './shared-components.module';

/**
 * KngSharedModule
 *
 * @deprecated Utilisez KngSharedComponentsModule directement.
 * Ce module est conservé pour rétrocompatibilité uniquement.
 *
 * ⚠️ PLUS DE ROUTES - Les routes sont dans app.routes.ts
 */
@NgModule({
  imports: [
    KngSharedComponentsModule,
  ],
  exports: [
    KngSharedComponentsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngSharedModule {
  public static forRoot(options?: any): ModuleWithProviders<KngSharedModule> {
    return {
      ngModule: KngSharedModule,
      providers: []
    };
  }
}
