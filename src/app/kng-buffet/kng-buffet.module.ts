import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Module commun (contient kng-calendar, etc.)
import { KngCommonModule } from '../common/common.module';

// Composant principal du module
import { KngBuffetComponent } from './kng-buffet.component';

// ✅ Utilise KngSharedComponentsModule (composants SANS routes)
import { KngSharedComponentsModule } from '../shared/shared-components.module';

/**
 * Module kng-buffet
 *
 * Page principale pour les buffets événementiels.
 * Remplace l'ancienne page /home/business (deprecated).
 *
 * ✅ Chargé eager (non lazy-loaded) pour permettre le cache RouteReuseStrategy
 * Les routes sont définies dans app.routes.ts
 */
@NgModule({
  declarations: [
    KngBuffetComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule, // ✅ Sans forChild car routes dans app.routes.ts
    KngCommonModule,
    KngSharedComponentsModule,
  ],
  exports: [
    // Exporté pour le routing dans app.routes.ts
    KngBuffetComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngBuffetModule {}
