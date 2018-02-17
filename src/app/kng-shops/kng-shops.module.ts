import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KngShopsComponent } from './kng-shops.component';

import { Kng2CoreModule  } from 'kng2-core';

//
// define routes module
const routes: Routes = [
  { path: '', component: KngShopsComponent }
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    Kng2CoreModule,
    routing
  ],
  declarations: [
    KngShopsComponent,
  ]
})
export class ShopsModule { }
