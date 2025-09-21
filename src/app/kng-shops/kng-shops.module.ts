import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';




//
// define routes module
const routes: Routes = [
];

const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

//
// define module
@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  exports:[
  ],
  declarations: [
  ]
})
export class KngShopsModule { }
