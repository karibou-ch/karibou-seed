import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KngShopsComponent, KngShopComponent } from './kng-shops.component';

import { Kng2CoreModule, LoaderResolve  } from 'kng2-core';


//
// define routes module
const routes: Routes = [
];

const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  exports:[
  ],
  declarations: [
  ]
})
export class KngShopsModule { }
