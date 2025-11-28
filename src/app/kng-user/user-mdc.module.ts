import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcTextFieldModule
  ],
  declarations: []
})
export class UserMdcModule { }
