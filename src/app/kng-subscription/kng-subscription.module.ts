import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxStripeModule } from 'ngx-stripe';

// Module commun (contient kng-subscription-option, kng-calendar, etc.)
import { KngCommonModule } from '../common/common.module';

// Composants du module
import { KngSubscriptionComponent } from './kng-subscription.component';
import { KngSubscriptionControlComponent } from './kng-subscription-control.component';
import { KngSubscriptionItemComponent } from './kng-subscription-item.component';

// ✅ Utilise KngSharedComponentsModule (composants SANS routes)
import { KngSharedComponentsModule } from '../shared/shared-components.module';

/**
 * Module kng-subscription
 * ✅ Chargé eager (non lazy-loaded) pour permettre le cache RouteReuseStrategy
 * Les routes sont définies dans app.routes.ts
 */
@NgModule({
  declarations: [
    KngSubscriptionComponent,
    KngSubscriptionControlComponent,
    KngSubscriptionItemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule, // ✅ Sans forChild car routes dans app.routes.ts
    NgxStripeModule,
    KngCommonModule,
    KngSharedComponentsModule,
  ],
  exports: [
    // Exporté pour le routing dans app.routes.ts
    KngSubscriptionComponent,
    // Exportés pour utilisation dans kng-user (user-subscription.component)
    KngSubscriptionControlComponent,
    KngSubscriptionItemComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngSubscriptionModule {}
