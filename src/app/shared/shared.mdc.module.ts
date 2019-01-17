import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcCardModule,
  MdcChipsModule,
  MdcTextFieldModule,
  MdcCheckboxModule,
  MdcLinearProgressModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcCardModule,
    MdcChipsModule,
    MdcTextFieldModule,
    MdcCheckboxModule,
    MdcLinearProgressModule
    ],
  declarations: []
})
export class KngSharedMdcModule { }
