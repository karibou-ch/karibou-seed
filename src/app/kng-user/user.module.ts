import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserRegisterComponent } from './user-register.component';
import { UserSignComponent } from './user-sign.component';
import { UserProfileComponent } from './user-profile.component';


//
// define routes module
const routes: Routes = [
  { path: '', component: UserProfileComponent },
  { path: 'login', component: UserSignComponent },
  { path: 'register', component: UserRegisterComponent },
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    routing
  ],
  declarations: [
    UserProfileComponent,
    UserRegisterComponent,
    UserSignComponent
  ]
})
export class UserModule { }
