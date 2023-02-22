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
    MdcMenuModule,
    MdcRippleModule,
    MdcTextFieldModule,
    MdcTabBarModule
  ],
  declarations: []
})
export class UserMdcModule { }
