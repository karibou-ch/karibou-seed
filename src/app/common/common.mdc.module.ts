import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcDrawerModule,
  MdcFabModule,
  MdcFormFieldModule,
  MdcIconModule,
  MdcListModule,
  MdcSnackbarModule,
  MdcRadioModule,
  MdcTabBarModule,
  MdcTopAppBarModule,
  MdcTypographyModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcDrawerModule,
    MdcFabModule,
    MdcFormFieldModule,
    MdcIconModule,
    MdcListModule,
    MdcSnackbarModule,
    MdcRadioModule,
    MdcTabBarModule,
    MdcTopAppBarModule,
    MdcTypographyModule
  ],
  declarations: []
})
export class CommonMdcModule { }
