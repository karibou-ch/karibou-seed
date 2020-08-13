import { Routes } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngValidateMailComponent } from './kng-validate-mail/kng-validate-mail.component';
import { IsWelcomeGard } from './common';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';
import { KngRootComponent } from './kng-root/kng-root.component';
import { KngNavigationStoreResolve } from './common/navigation.store.service';



// FIXME redirect routes based on unknown store name
export const appRoutes: Routes = [
  { path: 'me', loadChildren: './kng-user/user.module#UserModule' },
  {
    path: 'validate/:uid/:mail',
    component: KngValidateMailComponent,
    resolve: { loader: LoaderResolve }
  },
  {
    path: 'store/:store',
    component: KngRootComponent,
    resolve: { loader: LoaderResolve, shops: KngNavigationStoreResolve },
    loadChildren: () => import('./shared/shared.module').then( m => m.SharedModule)
  },
  { path: 'products/:sku/:title', pathMatch: 'full', redirectTo: '/store/geneva/home/products/:sku/:title' },
  { path: 'products/:sku', pathMatch: 'full', redirectTo: '/store/geneva/home/products/:sku' },
  { path: 'shop/:slug', pathMatch: 'full', redirectTo: '/store/geneva/shops/:slug' },
  { path: 'account/orders', pathMatch: 'full', redirectTo: '/store/geneva/me/orders' },
  {
    path: '',
    pathMatch: 'full',
    resolve: { loader: LoaderResolve },
    canActivate: [IsWelcomeGard],
    component: KngWelcomeComponent
  },
  { path: 'oops', component: KngServerErrorFoundComponent},
  { path: '**', component: KngPageNotFoundComponent},
];
