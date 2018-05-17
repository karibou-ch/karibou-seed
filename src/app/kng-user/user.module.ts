import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IsAuthenticated, LoaderResolve } from 'kng2-core';
import { SharedModule } from '../shared/shared.module';

import { UserSignComponent, 
         AddressComponent, 
         CardComponent, 
         UserEmailComponent, 
         UserOrdersComponent, 
         UserPasswordComponent, 
         UserProfileComponent } from './';


import { NgxStripeModule } from 'ngx-stripe';
         
import { UserMdcModule } from './user-mdc.module';
import { IsAuthenticatedGard } from '../shared';
//
// define routes module
// get an EmptyError: no elements in sequence with this route
const routes: Routes = [
  { path: '', component: UserProfileComponent, resolve:{ loader:LoaderResolve }, canActivateChild:[IsAuthenticatedGard], children:[
    { path: 'orders', component: UserOrdersComponent, resolve:{ loader:LoaderResolve } },
    { path: 'email', component: UserEmailComponent, resolve:{ loader:LoaderResolve }  },
    { path: 'password', component: UserPasswordComponent, resolve:{ loader:LoaderResolve }  }  
  ]},
  { path: 'login', component: UserSignComponent, resolve:{ loader:LoaderResolve }},
  { path: 'login-or-register', component: UserSignComponent, data:{address:true,payment:true,validation:true}, resolve:{ loader:LoaderResolve } },
  { path: 'login-or-address', component: UserSignComponent, data:{address:true,payment:false,validation:true}, resolve:{ loader:LoaderResolve } },
  { path: 'login-or-payment', component: UserSignComponent, data:{address:false,payment:true,validation:true}, resolve:{ loader:LoaderResolve } },
  { path: 'logout', component: UserSignComponent, data:{action:'logout'}, resolve:{ loader:LoaderResolve } },
  { path: 'register', component: UserSignComponent, data:{action:'signup'}, resolve:{ loader:LoaderResolve } },
];


const routing: ModuleWithProviders = RouterModule.forChild(routes);


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    NgxStripeModule.forRoot(),
    FormsModule, ReactiveFormsModule,
    UserMdcModule,
    routing
  ],
  declarations: [
    AddressComponent,
    CardComponent,
    UserOrdersComponent,
    UserEmailComponent,
    UserPasswordComponent,
    UserProfileComponent,
    UserSignComponent
  ]
})
export class UserModule { }
