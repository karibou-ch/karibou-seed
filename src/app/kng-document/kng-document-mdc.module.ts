import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCheckboxModule,
  MdcElevationModule,
  MdcFabModule,
  MdcFormFieldModule,
  MdcListModule,
  MdcSelectModule,
  MdcSnackbarModule,
  MdcSwitchModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCheckboxModule,
    MdcElevationModule,
    MdcFabModule,
    MdcFormFieldModule,
    MdcListModule,
    MdcSelectModule,
    MdcSnackbarModule,
    MdcSwitchModule,
    MdcTextFieldModule
  ],
  declarations: []
})
export class KngDocumentMdcModule { }
