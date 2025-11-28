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
    MdcSwitchModule,
    MdcTextFieldModule
  ],
  declarations: []
})
export class KngDocumentMdcModule { }
