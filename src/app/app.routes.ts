import { RouterModule, Routes } from '@angular/router';
import { IsAuthenticated, Kng2CoreModule } from 'kng2-core';

import { WelcomeComponent } from './kng-welcome/welcome.component';
import { UserSignComponent, UserRegisterComponent } from './kng-user';
import { ProductListComponent, ProductComponent } from './kng-product';

export const appRoutes: Routes = [
  { path: 'login', component: UserSignComponent },
  { path: 'register', component: UserRegisterComponent },
  { path: 'products/category/:category', component: ProductListComponent },
  { path: 'products/:sku', component: ProductComponent },
  
//  { path: 'dashboard', component: DashboardComponent },
  {
    path: '',
    pathMatch: 'full',
    component: WelcomeComponent
  },
  // { path: '**', component: PageNotFoundComponent }
];
