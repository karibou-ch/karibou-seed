import { NgModule, ModuleWithProviders } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KngDocumentComponent, KngEditDocumentComponent } from './kng-document.component';

import { Kng2CoreModule  } from 'kng2-core';
import { KngDocumentMdcModule } from './kng-document-mdc.module';

//
// define routes module
const routes: Routes = [
  { path: 'create', component: KngEditDocumentComponent, data:{edit:true} },
  { path: 'category/:category', component: KngDocumentComponent },  
  { path: ':slug', component: KngDocumentComponent },
  { path: ':slug/edit', component: KngEditDocumentComponent }
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Kng2CoreModule,
    KngDocumentMdcModule,
    routing
  ],
  exports:[
    KngDocumentComponent,
    KngEditDocumentComponent
  ],
  declarations: [
    KngDocumentComponent,
    KngEditDocumentComponent
  ]
})
export class KngDocumentModule { }
