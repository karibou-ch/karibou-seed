import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { CartMdcModule } from './mdc.module';
import { KngCartComponent } from './kng-cart.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoaderResolve } from 'kng2-core';
import { KngCommonModule } from '../common/common.module';


//
// define routes module
const routes: Routes = [
  { 
    path: '', 
    pathMatch: 'full', 
    component: KngCartComponent, 
    resolve:{ loader:LoaderResolve } 
  }
];

//
// 
const routing: ModuleWithProviders = RouterModule.forChild(routes);


@NgModule({
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule,
    CartMdcModule,
    KngCommonModule,
    SharedModule,
    routing
  ],
  declarations: [
    KngCartComponent
  ]
})
export class KngCartModule { }
