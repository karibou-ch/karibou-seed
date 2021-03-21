import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KngShopsComponent, KngShopComponent } from './kng-shops.component';

import { Kng2CoreModule, LoaderResolve  } from 'kng2-core';
import { MdcIconModule } from '@angular-mdc/web';
import { MdcImageListModule } from '@angular-mdc/web/image-list';

import { SharedModule } from '../shared/shared.module';

//
// define routes module
const routes: Routes = [
  { path: 'list', pathMatch:'full', component: KngShopsComponent, resolve: { loader: LoaderResolve } },
  { path: ':urlpath', component: KngShopComponent, resolve: { loader: LoaderResolve } },
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
    MdcImageListModule,
    routing
  ],
  declarations: [
    KngShopComponent,
    KngShopsComponent,
  ]
})
export class ShopsModule { }
