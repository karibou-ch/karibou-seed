import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCardModule,
  MdcDrawerModule,
  MdcDialogModule,
  MdcElevationModule,
  MdcFabModule,
  MdcListModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcSnackbarModule,
  MdcSelectModule,
  MdcTabBarModule,
  MdcTextFieldModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCardModule,
    MdcDrawerModule,
    MdcDialogModule,
    MdcElevationModule,
    MdcFabModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcSelectModule,
    MdcSnackbarModule,
    MdcTextFieldModule,
    MdcTabBarModule
  ],
  declarations: []
})
export class UserMdcModule { }
