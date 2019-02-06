import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KngShopsComponent } from './kng-shops.component';

import { Kng2CoreModule, LoaderResolve  } from 'kng2-core';
import { MdcIconModule } from '@angular-mdc/web';
import { SharedModule } from '../shared/shared.module';

//
// define routes module
const routes: Routes = [
  { path: ':urlpath', component: KngShopsComponent, resolve:{ loader:LoaderResolve } }  
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    Kng2CoreModule,
    SharedModule,
    MdcIconModule,
    routing
  ],
  declarations: [
    KngShopsComponent,
  ]
})
export class ShopsModule { }
