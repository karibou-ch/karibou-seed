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
  MdcSnackbarModule,
  MdcTabModule,
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
    MdcSnackbarModule,
    MdcTabModule,
    MdcThemeModule,
    MdcTypographyModule
  ],
  declarations: []
})
export class MdcModule { }
