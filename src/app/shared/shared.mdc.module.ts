import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcTextFieldModule,
  MdcCheckboxModule,
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcTextFieldModule,
    MdcCheckboxModule,
  ],
  declarations: []
})
export class KngSharedMdcModule { }
