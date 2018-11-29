import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

//
// exported components and directives
import { KngControlMessagesComponent } from './kng-control-messages/control-messages.component';
import { MdcSearchBarComponent } from './mdc-search-bar/mdc-search-bar.component';
import { KngNavigationStateService } from './navigation.service';
import { InfiniteScrollerDirective } from './infinite-scroller.directive';
import { IsAuthenticatedGard,
         IsWelcomeGard } from './is-authenticated-gard.service';
import { i18n } from './i18n.service';
import { KngMailConfirmationComponent } from './kng-mail-confirmation/kng-mail-confirmation.component';
import { KngFooterComponent } from './kng-footer/kng-footer.component';
import { KngTextfieldAutosizeDirective } from './kng-textfield-autosize.directive';
import { KngQuickEditorComponent, KngEditorDirective } from './kng-quick-editor/quick-editor.component';

//
// that should be in a specific admin module
import { UcWidgetComponent } from './kng-uc-widget/uc-widget';

import {
  MdcLinearProgressModule,
  MdcListModule,
  MdcFabModule,
  MdcFormFieldModule,
  MdcRadioModule,
  MdcCheckboxModule,
} from '@angular-mdc/web';
import { RouterModule } from '@angular/router';
import { KngOrderFeedbackComponent } from './kng-order-feedback/kng-order-feedback.component';
import { KngLazyLoadDirective } from './kng-lazy-load.directive';
import { KngUiBottomActionsComponent } from './kng-ui-bottom-actions/kng-ui-bottom-actions.component';
import { KngUserReminderComponent } from './kng-user-reminder/kng-user-reminder.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MdcCheckboxModule,
    MdcFabModule,
    MdcRadioModule,
    MdcLinearProgressModule,
    MdcListModule
    ],
  exports:[
    KngControlMessagesComponent,
    KngEditorDirective,
    KngFooterComponent,
    KngMailConfirmationComponent,
    KngUserReminderComponent,
    InfiniteScrollerDirective,
    MdcCheckboxModule,
    MdcFabModule,
    MdcRadioModule,
    MdcLinearProgressModule,
    MdcListModule,
    MdcSearchBarComponent,
    KngTextfieldAutosizeDirective,
    KngQuickEditorComponent,
    UcWidgetComponent,
    KngUiBottomActionsComponent
  ],
  declarations: [
    KngControlMessagesComponent,
    KngEditorDirective,
    KngFooterComponent,
    KngMailConfirmationComponent,
    InfiniteScrollerDirective,
    MdcSearchBarComponent,
    KngQuickEditorComponent,
    KngTextfieldAutosizeDirective,
    KngOrderFeedbackComponent,
    KngLazyLoadDirective,
    UcWidgetComponent,
    KngUiBottomActionsComponent,
    KngUserReminderComponent
  ],
})
export class SharedModule { 
  public static forRoot(options?:any): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        i18n,
        KngNavigationStateService,
        IsAuthenticatedGard,
        IsWelcomeGard
      ]
    }        
  }
}
