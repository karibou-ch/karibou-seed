import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { KngSharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Kng2CoreModule } from 'kng2-core';
import { KngCommonModule } from '../common/common.module';
import { KngAssistantBotComponent } from './kng-assistant-bot.component';


//
// define routes module
const routes: Routes = [
  { path: ':name', component: KngAssistantBotComponent}
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
    KngAssistantBotComponent
  ]
})
export class KngAssistantBotModule { }
