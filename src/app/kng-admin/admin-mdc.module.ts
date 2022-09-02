import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCardModule,
  MdcChipsModule,
  MdcCheckboxModule,
  MdcDrawerModule,
  MdcDialogModule,
  MdcElevationModule,
  MdcFabModule,
  MdcFormFieldModule,
  MdcListModule,
  MdcMenuModule,
  MdcRadioModule,
  MdcRippleModule,
  MdcSnackbarModule,
  MdcTabBarModule,
  MdcTextFieldModule,
  MDCDataTableModule,
  MdcSelectModule,
  MdcIconModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCardModule,
    MdcCheckboxModule,
    MdcChipsModule,
    MdcDrawerModule,
    MdcDialogModule,
    MdcIconModule,
    MdcElevationModule,
    MdcFabModule,
    MdcFormFieldModule,
    MdcListModule,
    MdcMenuModule,
    MdcRadioModule,
    MdcRippleModule,
    MdcSnackbarModule,
    MdcTextFieldModule,
    MdcTabBarModule,
    MDCDataTableModule,
    MdcSelectModule
  ],
  declarations: []
})
export class AdminMdcModule { }
