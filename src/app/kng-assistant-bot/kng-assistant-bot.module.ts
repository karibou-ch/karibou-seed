import { NgModule, ModuleWithProviders, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { KngSharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Kng2CoreModule, LoaderResolve } from 'kng2-core';
import { KngCommonModule } from '../common/common.module';
import { KngAssistantBotComponent } from './kng-assistant-bot.component';


/**
 * Routes du module assistant
 * - path '' : Vue principale de l'assistant
 * - path ':name' : Assistant avec agent spécifique (james, quote, etc.)
 * - resolve: LoaderResolve pour charger config, user, categories
 */
const routes: Routes = [
  { path: '', component: KngAssistantBotComponent, resolve: { loader: LoaderResolve } },
  { path: ':name', component: KngAssistantBotComponent, resolve: { loader: LoaderResolve } }
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngAssistantBotModule { }
