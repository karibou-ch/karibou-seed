import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KngDocumentComponent } from './kng-document.component';

import { Kng2CoreModule  } from 'kng2-core';

//
// define routes module
const routes: Routes = [
  { path: 'create', component: KngDocumentComponent },
  { path: 'category/:category', component: KngDocumentComponent },  
  { path: ':slug', component: KngDocumentComponent }
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    Kng2CoreModule,
    routing
  ],
  declarations: [
    KngDocumentComponent,
  ]
})
export class KngDocumentModule { }
