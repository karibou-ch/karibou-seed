import { NgModule, ModuleWithProviders, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// ✅ Utilise KngSharedComponentsModule (composants SANS routes)
import { KngSharedComponentsModule } from '../shared/shared-components.module';

// Layout
import { AdminLayoutComponent } from './admin-layout.component';

// Web Awesome components (side-effect import)
import './admin-wa';

// Components
import { KngCategoriesComponent, KngCategoryDlgComponent } from './kng-category/';
import { KngConfigComponent,
         KngNavigationComponent,
         KngNavigationDlgComponent,
         KngWelcomeCfgComponent,
         KngShopComponent,
         KngPageContentComponent} from './kng-config/kng-config.component';
import {
  KngHUBComponent,
  KngHubCategoriesComponent,
  KngHubClosuresComponent,
  KngHubTeamComponent,
  KngHubVendorsComponent,
  KngInformationCfgComponent
} from './kng-config/kng-hub.component';
import { KngConfigInputComponent } from './kng-config/kng-config-input.component';
import { KngDepositDlgComponent, KngDepositComponent } from './kng-config/kng-deposit.component';
import { KngHubOverviewComponent } from './kng-config/kng-hub.component';
import { KngLangToggleComponent } from './kng-lang-toggle.component';
import { KngStatusComponent } from './kng-status.component';
import { KngChecklistComponent } from './kng-checklist.component';
import { KngSaveBarComponent } from './kng-save-bar.component';

//
// Routes avec layout parent
const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: KngHubOverviewComponent },
      { path: 'cat', component: KngCategoriesComponent },
      { path: 'category', component: KngCategoriesComponent },
      { path: 'config', component: KngConfigComponent },
      { path: 'information', component: KngInformationCfgComponent },
      { path: 'welcome', component: KngWelcomeCfgComponent },
      { path: 'main-hub', component: KngHUBComponent },
      { path: 'manager-hub', redirectTo: 'team', pathMatch: 'full' },
      { path: 'closures', component: KngHubClosuresComponent },
      { path: 'team', component: KngHubTeamComponent },
      { path: 'hub-vendors', component: KngHubVendorsComponent },
      { path: 'hub-categories', component: KngHubCategoriesComponent },
      { path: 'shop', component: KngShopComponent },
      { path: 'navigation', component: KngNavigationComponent, data: { menu: true } },
      { path: 'deposit', component: KngDepositComponent, data: { deposit: true } },
      { path: 'page', component: KngPageContentComponent, children: [
        { path: 'list', loadChildren: () => import('../kng-document/kng-document.module').then(m => m.KngDocumentModule) }
      ]}
    ]
  }
];

const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KngSharedComponentsModule, // ✅ Composants sans routes
    routing
  ],
  declarations: [
    AdminLayoutComponent,
    KngLangToggleComponent,
    KngStatusComponent,
    KngHubOverviewComponent,
    KngChecklistComponent,
    KngSaveBarComponent,
    KngConfigInputComponent,
    KngCategoriesComponent,
    KngConfigComponent,
    KngHUBComponent,
    KngHubClosuresComponent,
    KngHubTeamComponent,
    KngHubVendorsComponent,
    KngHubCategoriesComponent,
    KngDepositComponent,
    KngPageContentComponent,
    KngShopComponent,
    KngWelcomeCfgComponent,
    KngInformationCfgComponent,
    KngNavigationComponent,
    KngNavigationDlgComponent,
    KngDepositDlgComponent,
    KngCategoryDlgComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminModule { }
