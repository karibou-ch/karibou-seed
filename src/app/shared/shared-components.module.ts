import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Kng2CoreModule } from 'kng2-core';
import { KngCommonModule } from '../common/common.module';

/**
 * Composants et directives partagés
 */
import { KngControlMessagesComponent } from './kng-control-messages/control-messages.component';
import { InfiniteScrollerDirective } from './infinite-scroller.directive';
import { KngTextfieldAutosizeDirective } from './kng-textfield-autosize.directive';
import { UcWidgetComponent } from './kng-uc-widget/uc-widget';
import { KngUserReminderComponent } from './kng-user-reminder/kng-user-reminder.component';
import { KngProductLinkComponent } from './kng-product-link/kng-product-link.component';
import { KngStreamSentenceComponent } from './kng-stream-sentence/kng-stream-sentence.component';

/**
 * Composants Product
 */
import {
  ProductSwipeComponent,
  ProductListComponent,
  KngProductListByShopComponent,
  ProductGroupedListComponent,
  ProductThumbnailComponent,
  ProductComponent,
  ProductTinyComponent
} from '../kng-product';

/**
 * Composants Assistant
 */
import { KngAssistantComponent } from './kng-assistant/kng-assistant.component';
import { KngAssistantHistoryComponent } from './kng-assistant/kng-assistant-history.component';
import { KngPromptComponent } from './kng-assistant/kng-prompt.component';
import { KngAudioAssistantComponent } from './kng-audio-assistant/kng-audio-assistant.component';
import { KngBusinessOptionComponent } from './kng-business-option/kng-business-option.component';

/**
 * Composants Page
 */
import { KngHomeComponent } from '../kng-home/kng-home.component';
import { KngShopComponent, KngShopsComponent } from '../kng-shops/kng-shops.component';

/**
 * KngSharedComponentsModule
 *
 * Module contenant UNIQUEMENT les composants partagés, SANS les routes.
 * À utiliser quand on a besoin des composants sans charger les routes de shared.
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    Kng2CoreModule,
    KngCommonModule,
  ],
  declarations: [
    // Directives
    KngTextfieldAutosizeDirective,
    InfiniteScrollerDirective,
    // Composants utilitaires
    KngControlMessagesComponent,
    KngUserReminderComponent,
    UcWidgetComponent,
    KngProductLinkComponent,
    KngStreamSentenceComponent,
    // Composants Assistant
    KngAudioAssistantComponent,
    KngAssistantComponent,
    KngAssistantHistoryComponent,
    KngPromptComponent,
    KngBusinessOptionComponent,
    // Composants Product
    ProductComponent,
    ProductTinyComponent,
    ProductListComponent,
    KngProductListByShopComponent,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    // Composants Page
    KngHomeComponent,
    KngShopComponent,
    KngShopsComponent,
  ],
  exports: [
    // Re-export des modules de base
    RouterModule,
    KngCommonModule,
    // Directives
    KngTextfieldAutosizeDirective,
    InfiniteScrollerDirective,
    // Composants utilitaires
    KngControlMessagesComponent,
    KngUserReminderComponent,
    UcWidgetComponent,
    // Composants Assistant
    KngAssistantComponent,
    KngAssistantHistoryComponent,
    KngPromptComponent,
    KngAudioAssistantComponent,
    KngBusinessOptionComponent,
    // Composants Product
    ProductComponent,
    ProductTinyComponent,
    ProductListComponent,
    KngProductListByShopComponent,
    ProductGroupedListComponent,
    ProductThumbnailComponent,
    ProductSwipeComponent,
    // Composants Page
    KngHomeComponent,
    KngShopComponent,
    KngShopsComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngSharedComponentsModule {}
