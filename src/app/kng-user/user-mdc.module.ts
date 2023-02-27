import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCheckboxModule,
  MdcDialogModule,
  MdcElevationModule,
  MdcIconModule,
  MdcMenuModule,
  MdcListModule,
  MdcRippleModule,
  MdcTabBarModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcIconModule,
    MdcCheckboxModule,
    MdcDialogModule,
    MdcElevationModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcTextFieldModule,
    MdcTabBarModule
  ],
  declarations: []
})
export class UserMdcModule { }
