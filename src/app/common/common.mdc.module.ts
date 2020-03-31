import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcDrawerModule,
  MdcDialogModule,
  MdcFabModule,
  MdcFormFieldModule,
  MdcIconModule,
  MdcListModule,
  MdcMenuModule,
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
    MdcDialogModule,
    MdcFabModule,
    MdcFormFieldModule,
    MdcIconModule,
    MdcListModule,
    MdcMenuModule,
    MdcSnackbarModule,
    MdcRadioModule,
    MdcTabBarModule,
    MdcTopAppBarModule,
    MdcTypographyModule
  ],
  declarations: []
})
export class CommonMdcModule { }
