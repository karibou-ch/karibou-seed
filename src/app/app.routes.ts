import { RouterModule,  RouterOutlet, Routes } from '@angular/router';
import { IsAuthenticated, Kng2CoreModule } from 'kng2-core';

import { KngDepartementComponent } from './kng-departement/departement.component';
import { KngHomeComponent } from './kng-home/kng-home.component';
import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { ProductListComponent, ProductComponent } from './kng-product';

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
  {
    path:'store',
    children:[
    { path:'', component:KngWelcomeComponent },{ 
      path:':store',
      component:KngWelcomeComponent,
      children:[{path:'',component:KngHomeComponent},
        { path: 'me', loadChildren: './kng-user/user.module#UserModule' },
        { path: 'shops', loadChildren: './kng-shops/kng-shops.module#ShopsModule' },
        { path: 'content', loadChildren: './kng-document/kng-document.module#KngDocumentModule' },      
        { path: 'departement',component:KngDepartementComponent },
        { path: 'products/:sku', component: ProductComponent, outlet:'modal'},
        { path: 'products/category/:category', component: ProductListComponent },
      ]
    }]
  },
  // { path: 'products/category/:category/:sku', component: ProductComponent, outlet:'modal'},
  // { path: 'products/category/:category', component: ProductListComponent},

  { path: 'products/category/:category', component: ProductListComponent,children:[
    { path: ':sku', component: ProductComponent, outlet:'modal' }
  ]},
  
  
//  { path: 'dashboard', component: DashboardComponent },
  {
    path: '',
    pathMatch: 'full',
    component: KngWelcomeComponent
  },
  // { path: '**', component: PageNotFoundComponent }
];
