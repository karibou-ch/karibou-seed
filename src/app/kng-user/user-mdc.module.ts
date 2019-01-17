import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcCheckboxModule,
  MdcDialogModule,
  MdcElevationModule,
  MdcLinearProgressModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcSelectModule,
  MdcTabBarModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcCheckboxModule,
    MdcDialogModule,
    MdcElevationModule,
    MdcLinearProgressModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcSelectModule,
    MdcTextFieldModule,
    MdcTabBarModule
  ],
  declarations: []
})
export class UserMdcModule { }
