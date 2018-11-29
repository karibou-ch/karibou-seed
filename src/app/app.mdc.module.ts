import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCardModule,
  MdcChipsModule,
  MdcDrawerModule,
  MdcFabModule,
  MdcSnackbarModule,
  MdcTabBarModule,
  MdcTopAppBarModule,
  MdcTypographyModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCardModule,
    MdcChipsModule,
    MdcDrawerModule,
    MdcFabModule,
    MdcSnackbarModule,
    MdcTabBarModule,
    MdcTopAppBarModule,
    MdcTypographyModule
  ],
  declarations: []
})
export class MdcModule { }
