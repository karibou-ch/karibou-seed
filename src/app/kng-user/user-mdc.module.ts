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
  MdcIconModule,
  MdcListModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcSnackbarModule,
  MdcSelectModule,
  MdcTabBarModule,
  MdcThemeModule,
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
    MdcIconModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcSelectModule,
    MdcSnackbarModule,
    MdcTextFieldModule,
    MdcTabBarModule,
    MdcThemeModule
  ],
  declarations: []
})
export class UserMdcModule { }
