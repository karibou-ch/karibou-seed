import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCheckboxModule,
  MdcListModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCheckboxModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcTextFieldModule,
  ],
  declarations: []
})
export class CartMdcModule { }
