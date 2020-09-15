import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcCardModule,
  MdcChipsModule,
  MdcTextFieldModule,
  MdcCheckboxModule,
  MdcLinearProgressModule,
  MdcFormFieldModule,
  MdcDialogModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcCardModule,
    MdcChipsModule,
    MdcDialogModule,
    MdcFormFieldModule,
    MdcTextFieldModule,
    MdcCheckboxModule,
    MdcLinearProgressModule
    ],
  declarations: []
})
export class KngSharedMdcModule { }
