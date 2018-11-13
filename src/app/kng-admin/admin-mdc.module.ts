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
  MdcIconModule,
  MdcListModule,
  MdcMenuModule,
  MdcRadioModule,
  MdcRippleModule,
  MdcSnackbarModule,
  MdcTabBarModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCardModule,
    MdcCheckboxModule,
    MdcChipsModule,
    MdcDrawerModule,
    MdcDialogModule,
    MdcElevationModule,
    MdcFabModule,
    MdcFormFieldModule,
    MdcIconModule,
    MdcListModule,
    MdcMenuModule,
    MdcRadioModule,
    MdcRippleModule,
    MdcSnackbarModule,
    MdcTextFieldModule,    
    MdcTabBarModule
  ],
  declarations: []
})
export class AdminMdcModule { }
