import { RouterModule,  RouterOutlet, Routes } from '@angular/router';
import { IsAuthenticated, Kng2CoreModule, LoaderResolve } from 'kng2-core';

import { KngDepartementComponent } from './kng-departement/departement.component';
import { KngHomeComponent } from './kng-home/kng-home.component';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { ProductListComponent, ProductComponent } from './kng-product';
import { KngCartComponent } from './kng-cart/kng-cart.component';
import { KngValidateMailComponent } from './kng-validate-mail/kng-validate-mail.component';
import { IsWelcomeGard } from './shared';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';

//
// /store/geneva/
//        me/
//        products/
//        shops/
//        departement/

//
// si le route parent [implique] un component(Parent) sans router-outlet [alors]
//  --> un composant Enfant ne peut pas injecter son contenu!
//  --> les router-outlet doivent suivre la hiérarchie des composants
// path:'x',
// comp:Parent:children:[
//   {path:'y',comp:Enfant}
// ]


export const appRoutes: Routes = [
  { path: 'validate/:uid/:mail',component:KngValidateMailComponent, resolve:{ loader:LoaderResolve } },
  { path: 'me', loadChildren: './kng-user/user.module#UserModule' },
  {
    path:'store',
    children:[
    { path:'',pathMatch: 'full', redirectTo:'/'},{ 
      path:':store',
      component:KngWelcomeComponent,
      resolve:{ loader:LoaderResolve },
      children:[
        { path: 'validate/:uid/:mail',component:KngValidateMailComponent, resolve:{ loader:LoaderResolve } },
        { path: 'me', loadChildren: './kng-user/user.module#UserModule' },
        { path: 'shops', loadChildren: './kng-shops/kng-shops.module#ShopsModule' },
        { path: 'content', loadChildren: './kng-document/kng-document.module#KngDocumentModule' },      
        { path: 'admin', loadChildren: './kng-admin/admin.module#AdminModule'  },
        { path: 'cart',loadChildren: './kng-cart/kng-cart.module#KngCartModule'   },
        // { path: 'departement',component:KngDepartementComponent },
        { path: 'products/category/:category', component: ProductListComponent },
        { path:'home',component:KngHomeComponent,resolve:{ loader:LoaderResolve },children:[
          { path: 'products/:sku', component: ProductComponent},
        ]},
        { path:'',pathMatch: 'full', redirectTo:'home'}
      ]
    }]
  },
  // { path: 'products/category/:category/:sku', component: ProductComponent, outlet:'modal'},
  // { path: 'products/category/:category', component: ProductListComponent},

  { path: 'products/category/:category',resolve:{ loader:LoaderResolve }, component: ProductListComponent,children:[
    { path: ':sku', component: ProductComponent, outlet:'modal' }
  ]},
  {
    path: '',
    pathMatch: 'full',    
    resolve:{ loader:LoaderResolve },
    canActivate:[IsWelcomeGard],
    component: KngWelcomeComponent
  },
  { path: 'oops', component: KngServerErrorFoundComponent},    
  { path: '**', component: KngPageNotFoundComponent},  
];
