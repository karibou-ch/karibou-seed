import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KngSharedModule } from '../shared/shared.module';


//
// exported components and directives
import { KngCategoriesComponent, KngCategoryDlgComponent } from './kng-category/';


import { KngConfigComponent,
         KngNavigationComponent,
         KngNavigationDlgComponent,
         KngWelcomeCfgComponent,
         KngShopComponent,
         KngPageContentComponent} from './kng-config/kng-config.component';
import { AdminMdcModule } from './admin-mdc.module';
import { KngHUBComponent, KngHUBManagerComponent, KngInformationCfgComponent } from './kng-config/kng-hub.component';
import { KngConfigInputComponent } from './kng-config/kng-config-input.component';
import { KngDepositDlgComponent, KngDepositComponent } from './kng-config/kng-deposit.component';

//
// define routes module
const routes: Routes = [
  { path: 'cat', component: KngCategoriesComponent },
  { path: 'category', component: KngCategoriesComponent },
  { path: 'config', component: KngConfigComponent },
  { path: 'information', component: KngInformationCfgComponent },
  { path: 'welcome', component: KngWelcomeCfgComponent },
  { path: 'main-hub', component: KngHUBComponent },
  { path: 'manager-hub', component: KngHUBManagerComponent },
  { path: 'shop', component: KngShopComponent },
  { path: 'navigation', component: KngNavigationComponent , data: {menu: true}},
  { path: 'deposit', component: KngDepositComponent , data: {deposit: true}},
  { path: 'page', component: KngPageContentComponent, children: [
    { path: 'list', loadChildren: () => import('../kng-document/kng-document.module').then(m => m.KngDocumentModule)}
  ]},
  { path: '**', redirectTo: 'config'}

];


//
//
const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminMdcModule,
    KngSharedModule,
    routing
  ],
  declarations: [
    KngConfigInputComponent,
    KngCategoriesComponent,
    KngConfigComponent,
    KngHUBComponent,
    KngHUBManagerComponent,
    KngDepositComponent,
    KngPageContentComponent,
    KngShopComponent,
    KngWelcomeCfgComponent,
    KngInformationCfgComponent,
    KngNavigationComponent,
    KngNavigationDlgComponent,
    KngDepositDlgComponent,
    KngCategoryDlgComponent
  ]
})
export class AdminModule { }
