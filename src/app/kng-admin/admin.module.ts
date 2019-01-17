import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { KngDocumentModule,  } from '../kng-document/kng-document.module';
import { KngEditDocumentComponent } from '../kng-document/kng-document.component';

//
// exported components and directives
import { KngCategoriesComponent } from './kng-category/';

import { KngConfigComponent, 
         KngNavigationComponent, 
         KngWelcomeCfgComponent,
         KngHomeComponent,
         KngShopComponent,
         KngPageContentComponent, 
         KngDepositComponent, 
         KngInformationCfgComponent} from './kng-config/kng-config.component';
import { AdminMdcModule } from './admin-mdc.module';
import { LoaderResolve } from 'kng2-core';

//
// define routes module
const routes: Routes = [
  { path: 'category', component: KngCategoriesComponent,resolve:{ loader:LoaderResolve } },
  { path: 'config', component: KngConfigComponent, resolve:{ loader:LoaderResolve } },
  { path: 'information', component: KngInformationCfgComponent, resolve:{ loader:LoaderResolve } },
  { path: 'welcome', component: KngWelcomeCfgComponent, resolve:{ loader:LoaderResolve } },
  { path: 'main-home', component: KngHomeComponent, resolve:{ loader:LoaderResolve } },
  { path: 'shop', component: KngShopComponent, resolve:{ loader:LoaderResolve } },
  { path: 'navigation', component: KngNavigationComponent , data:{menu:true}, resolve:{ loader:LoaderResolve }},
  { path: 'deposit', component: KngDepositComponent , data:{deposit:true}, resolve:{ loader:LoaderResolve }},
  { path: 'page', component: KngPageContentComponent,children:[{
    path:'', loadChildren: '../kng-document/kng-document.module#KngDocumentModule'
  }] },
  { path:'**', redirectTo:'config'}

];

//
// 
const routing: ModuleWithProviders = RouterModule.forChild(routes);


@NgModule({
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule,
    AdminMdcModule,
    SharedModule,
    routing
  ],
  declarations: [
    KngCategoriesComponent,
    KngConfigComponent, 
    KngDepositComponent,
    KngPageContentComponent,
    KngHomeComponent, 
    KngShopComponent, 
    KngWelcomeCfgComponent, 
    KngInformationCfgComponent,
    KngNavigationComponent]
})
export class AdminModule { }
