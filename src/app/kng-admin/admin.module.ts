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
         KngDepositComponent } from './kng-config/kng-config.component';
import { AdminMdcModule } from './admin-mdc.module';

//
// define routes module
const routes: Routes = [
  { path: 'category', component: KngCategoriesComponent },
  { path: 'config', component: KngConfigComponent },
  { path: 'welcome', component: KngWelcomeCfgComponent },
  { path: 'home', component: KngHomeComponent },
  { path: 'shop', component: KngShopComponent },
  { path: 'navigation', component: KngNavigationComponent , data:{menu:true}},
  { path: 'deposit', component: KngDepositComponent , data:{deposit:true}},
  { path: 'page', component: KngPageContentComponent,children:[{
    path:'', loadChildren: '../kng-document/kng-document.module#KngDocumentModule'
  }] }
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
    KngNavigationComponent]
})
export class AdminModule { }
