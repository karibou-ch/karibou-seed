import { Routes, Route } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { KngHomeComponent } from '../kng-home/kng-home.component';
import { KngProductListByShopComponent, ProductListComponent, ProductComponent } from '../kng-product';
import { KngShopsComponent } from '../kng-shops/kng-shops.component';


export const childrenRoute: Route[] = [
  { path: 'subscription', data: { subscription: true }, component: ProductListComponent },
  { path: 'products/:sku/:title', component: ProductComponent },
  { path: 'products/:sku', component: ProductComponent },
  { path: 'products', pathMatch: 'full', component: ProductComponent, data: { redirect: true } },
  { path: 'category/:category/:child', component: ProductListComponent },
  { path: 'category/:category', component: ProductListComponent },
  { path: 'category', pathMatch: 'full', redirectTo: '' },
  { path: '', pathMatch: 'full', redirectTo: '' }
];

// TODO needs dynamic DEPARTEMENT feature
export const appRoutes: Routes = [
  { path: 'cart', loadChildren: () => import('../kng-cart/kng-cart.module').then(m => m.KngCartModule) },
  { path: 'landing', loadChildren: () => import('../kng-shops/kng-shops.module').then(m => m.KngShopsModule) },
  { path: 'shops', component: KngShopsComponent, resolve: { loader: LoaderResolve }},
  { path: 'shops/:shop/:child', component: KngProductListByShopComponent },
  { path: 'shops/:shop', component: KngProductListByShopComponent },
  { path: 'me', loadChildren: () => import('../kng-user/user.module').then(m => m.UserModule) },

  // FIXME path construction is ugly
  { path: '', component: KngHomeComponent, data: { departement: 'home' }, resolve: { loader: LoaderResolve }, children: childrenRoute},
  { path: '', pathMatch: 'full' },
];
