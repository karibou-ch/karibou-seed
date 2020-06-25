import { Routes } from '@angular/router';

import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';



export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',    
    component: KngWelcomeComponent
  },
  { path: 'oops', component: KngServerErrorFoundComponent},    
  { path: '**', component: KngPageNotFoundComponent},  
];
