import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';

//
// exported components and directives
import { KngCategoriesComponent, 
         KngCategoryEditComponent } from './kng-category/';

import { KngConfigComponent } from './kng-config/kng-config.component';
import { KngMenuComponent } from './kng-menu/kng-menu.component';
import { AdminMdcModule } from './admin-mdc.module';

//
// define routes module
const routes: Routes = [
  { path: 'category', component: KngCategoriesComponent },
  { path: 'category/create', component: KngCategoryEditComponent, data:{create:true} },
  { path: 'category/:slug', component: KngCategoryEditComponent },
  { path: 'config', component: KngConfigComponent },
  { path: 'menu', component: KngConfigComponent },
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
    KngCategoryEditComponent, 
    KngConfigComponent, 
    KngMenuComponent]
})
export class AdminModule { }
