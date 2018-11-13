import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcAppBarModule,
  MdcButtonModule,
  MdcCardModule,
  MdcDrawerModule,
  MdcFabModule,
  MdcIconModule,
  MdcListModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcSnackbarModule,
  MdcTabBarModule,
  MdcThemeModule,
  MdcTypographyModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcAppBarModule,
    MdcButtonModule,
    MdcCardModule,
    MdcDrawerModule,
    MdcFabModule,
    MdcIconModule,
    MdcMenuModule,
    MdcListModule,
    MdcRippleModule,
    MdcSnackbarModule,
    MdcTabBarModule,
    MdcThemeModule,
    MdcTypographyModule
  ],
  declarations: []
})
export class MdcModule { }
