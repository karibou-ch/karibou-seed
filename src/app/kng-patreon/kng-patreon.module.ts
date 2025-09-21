import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { KngSharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Kng2CoreModule } from 'kng2-core';
import { KngCommonModule } from '../common/common.module';
import { KngPatreonComponent } from './kng-patreon.component';


//
// define routes module
const routes: Routes = [

  { path: ':name', component: KngPatreonComponent , children:[
    {path: 'user', loadChildren: () => import('../kng-user/user.module').then(m => m.UserModule)}
  ]},
  { path: '', pathMatch: 'full', redirectTo: 'default' }
];

//
//
const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    Kng2CoreModule,
    KngCommonModule,
    KngSharedModule,
    routing
  ],
  exports: [
    RouterModule, Kng2CoreModule
  ],
  declarations: [
    KngPatreonComponent
  ]
})
export class KngPatreonModule { }
