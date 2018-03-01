import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IsAuthenticated } from 'kng2-core';
import { SharedModule } from '../shared/shared.module';

import { UserSignComponent, 
         AddressComponent, 
         CardComponent, 
         UserOrdersComponent, 
         UserPasswordComponent, 
         UserProfileComponent } from './';

         
import { UserMdcModule } from './user-mdc.module';
//
// define routes module
const routes: Routes = [
  { path: '', component: UserProfileComponent  },
  { path: 'login', component: UserSignComponent},
  { path: 'logout', component: UserSignComponent, data:{action:'logout'} },
  { path: 'register', component: UserSignComponent, data:{action:'signup'} },
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule, ReactiveFormsModule,
    UserMdcModule,
    routing
  ],
  declarations: [
    AddressComponent,
    CardComponent,
    UserOrdersComponent,
    UserPasswordComponent,
    UserProfileComponent,
    UserSignComponent
  ]
})
export class UserModule { }
