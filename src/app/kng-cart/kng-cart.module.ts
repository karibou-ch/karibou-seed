import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { KngSharedModule } from '../shared/shared.module';
import { CartMdcModule } from './mdc.module';
import { KngCartComponent } from './kng-cart.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KngCommonModule } from '../common/common.module';
import { KngCartItemsComponent } from './kng-cart-items/kng-cart-items.component';
import { KngCartCheckoutComponent } from './kng-cart-checkout/kng-cart-checkout.component';
import { KngCartInvoiceComponent } from './kng-cart-invoice/kng-cart-invoice.component';


//
// define routes module
const routes: Routes = [

  { path: ':name', component: KngCartComponent , children:[
    {path: 'user', loadChildren: () => import('../kng-user/user.module').then(m => m.UserModule)}
  ]},
  { path: '', pathMatch: 'full', redirectTo: 'default' }
];

//
//
const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    CartMdcModule,
    KngCommonModule,
    KngSharedModule,
    routing
  ],
  exports: [
    RouterModule
  ],
  declarations: [
    KngCartComponent,
    KngCartItemsComponent,
    KngCartCheckoutComponent,
    KngCartInvoiceComponent
  ]
})
export class KngCartModule { }
