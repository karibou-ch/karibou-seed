import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcChipsModule,
  MdcTextFieldModule,
  MdcCheckboxModule,
  MdcFormFieldModule,
  MdcDialogModule,
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcChipsModule,
    MdcDialogModule,
    MdcFormFieldModule,
    MdcTextFieldModule,
    MdcCheckboxModule
    ],
  declarations: []
})
export class KngSharedMdcModule { }
