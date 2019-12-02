import { NgModule, ModuleWithProviders } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


import { KngDocumentComponent, KngEditDocumentComponent } from './kng-document.component';

import { Kng2CoreModule, LoaderResolve  } from 'kng2-core';
import { KngDocumentMdcModule } from './kng-document-mdc.module';
import { SharedModule } from '../shared/shared.module';
import { KngCommonModule } from '../common/common.module';
import { KngDocumentLoaderService } from './kng-document-loader.service';

//
// define routes module
const routes: Routes = [
  { path: 'create', component: KngEditDocumentComponent, data:{create:true}, resolve:{ loader:KngDocumentLoaderService } },
  { path: 'category/:category', component: KngDocumentComponent,resolve:{ loader:LoaderResolve } },  
  { path: ':slug/edit', component: KngEditDocumentComponent, data:{edit:true}, resolve:{ loader:KngDocumentLoaderService } },
  { path: ':slug', component: KngDocumentComponent,resolve:{ loader:KngDocumentLoaderService } }
//  { path: '', component: KngDocumentComponent,resolve:{ loader:LoaderResolve }, data:{ cards:true }}
];

const routing: ModuleWithProviders = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    KngCommonModule,
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
export class KngDocumentModule { 
  public static forRoot(options?:any): ModuleWithProviders {
    return {
      ngModule: KngDocumentModule,
      providers: [
        KngDocumentLoaderService
      ]
    }        
  }

}
