import { Routes } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngValidateMailComponent } from './kng-validate-mail/kng-validate-mail.component';
import { IsWelcomeGard } from './common';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';
import { KngRootComponent } from './kng-root/kng-root.component';



export const appRoutes: Routes = [
  { 
    path: 'validate/:uid/:mail',
    component:KngValidateMailComponent, 
    resolve:{ loader:LoaderResolve } 
  },
  {
    path:'store/:store',
    component: KngRootComponent,
    resolve:{ loader:LoaderResolve },
    loadChildren: './shared/shared.module#SharedModule'
    // children:[{path:'', loadChildren: './shared/shared.module#SharedModule'}]    
  },
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
