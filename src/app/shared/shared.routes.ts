import { Routes, Route } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { KngHomeComponent } from '../kng-home/kng-home.component';
import { ProductListComponent, ProductComponent } from '../kng-product';


// export const appRoutes: Routes = [
//   {
//     path:'',
//     pathMatch:'prefix',
//     resolve:{ loader:LoaderResolve },
//     children:[
//       { path: 'me', loadChildren: '../kng-user/user.module#UserModule' },
//       { path: 'shops', loadChildren: '../kng-shops/kng-shops.module#ShopsModule' },
//       { path: 'content', loadChildren: '../kng-document/kng-document.module#KngDocumentModule' },
//       { path: 'admin', loadChildren: '../kng-admin/admin.module#AdminModule'  },
//       { path: 'cart',loadChildren: '../kng-cart/kng-cart.module#KngCartModule'   },
//       { path:'home',component:KngHomeComponent,resolve:{ loader:LoaderResolve },children:[
//         { path: 'products/:sku', component: ProductComponent},
//         { path: 'category/:category/:child', component: ProductListComponent},
//         { path: 'category/:category', component: ProductListComponent},
//         { path: '', pathMatch:'full', redirectTo:''}
//       ]},
//       { path:'',pathMatch:'full', redirectTo:'home' },
//     ]
//   }
// ];

export const childrenRoute: Route[] = [
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
  { path: 'admin', loadChildren: '../kng-admin/admin.module#AdminModule' },
  { path: 'cart', loadChildren: '../kng-cart/kng-cart.module#KngCartModule' },
  { path: 'content', loadChildren: '../kng-document/kng-document.module#KngDocumentModule' },
  { path: 'me', loadChildren: '../kng-user/user.module#UserModule' },
  { path: 'shops', loadChildren: '../kng-shops/kng-shops.module#ShopsModule' },
  // FIXME path construction is ugly
  { path: 'home', component: KngHomeComponent, data: { departement: 'home' }, resolve: { loader: LoaderResolve }, children: childrenRoute},
  { path: 'cellar', component: KngHomeComponent, data: { departement: 'cellar' }, resolve: { loader: LoaderResolve }, children: childrenRoute},
  { path: 'selection', component: KngHomeComponent, data: { departement: 'selection' }, resolve: { loader: LoaderResolve }, children: childrenRoute},
  { path: 'wellness', component: KngHomeComponent, data: { departement: 'wellness' }, resolve: { loader: LoaderResolve }, children: childrenRoute},
  { path: '', pathMatch: 'full', redirectTo: '' },
];
