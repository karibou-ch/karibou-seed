import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { KngSharedModule } from '../shared/shared.module';

import {
  UserSignComponent,
  AddressComponent,
  CardComponent,
  UserEmailComponent,
  UserOrdersComponent,
  UserPasswordComponent,
  UserProfileComponent,
  UserSubscriptionComponent
} from './';


import { NgxStripeModule } from 'ngx-stripe';

import { IsAuthenticatedGard } from '../common';
import { KngCommonModule } from '../common/common.module';
import { KngSubscriptionModule } from '../kng-subscription/kng-subscription.module';
import { KngUserReminderComponent } from '../shared/kng-user-reminder/kng-user-reminder.component';
import { UserInvoicesComponent } from './user-invoices.component';
import { KngInvoiceComponent } from '../kng-invoice/kng-invoice.component';
//
// define routes module
// get an EmptyError: no elements in sequence with this route
const routes: Routes = [
  {
    path: '',
    component: UserProfileComponent,
    canActivateChild: [IsAuthenticatedGard],
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      { path: 'subscriptions', component: UserSubscriptionComponent },
      { path: 'orders', component: UserOrdersComponent },
      { path: 'invoices', component: UserInvoicesComponent },
      { path: 'reminder', component: KngUserReminderComponent },
      { path: 'email', component: UserEmailComponent },
      { path: 'password', component: UserPasswordComponent }
    ]
  },
  { path: 'login', component: UserSignComponent },
  {
    path: 'login-or-register',
    component: UserSignComponent,
    data: { address: false, payment: false, validation: true },
  },
  {
    path: 'login-or-address',
    component: UserSignComponent,
    data: { address: true, payment: false, validation: true },
  },
  {
    path: 'login-or-payment',
    component: UserSignComponent,
    data: { address: false, payment: true, validation: true },
  },
  {
    path: 'login-or-patreon',
    component: UserSignComponent,
    data: { address: false, payment: true, validation: true, minimal: true },
  },
  { path: 'logout', component: UserSignComponent, data: { action: 'logout' } },
  { path: 'register', component: UserSignComponent, data: { action: 'signup' } },
];



@NgModule({
  imports: [
    CommonModule,
    NgxStripeModule,
    FormsModule,
    ReactiveFormsModule,
    KngSharedModule,
    KngCommonModule,
    KngSubscriptionModule, // ✅ Import pour kng-subscription-control
    RouterModule.forChild(routes)
  ],
  exports: [
    AddressComponent, CardComponent, KngInvoiceComponent
  ],
  declarations: [
    AddressComponent,
    CardComponent,
    UserInvoicesComponent,
    UserOrdersComponent,
    UserEmailComponent,
    UserPasswordComponent,
    UserProfileComponent,
    UserSignComponent,
    UserSubscriptionComponent,
    KngInvoiceComponent
  ]
})
export class UserModule { }
