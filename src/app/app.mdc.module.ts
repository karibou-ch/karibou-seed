import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCardModule,
  MdcDrawerModule,
  MdcIconModule,
  MdcIconToggleModule,  
  MdcMenuModule,
  MdcSnackbarModule,
  MdcTabModule,
  MdcThemeModule,
  MdcToolbarModule,
  MdcTypographyModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCardModule,
    MdcDrawerModule,
    MdcIconModule,
    MdcIconToggleModule,
    MdcMenuModule,
    MdcSnackbarModule,
    MdcTabModule,
    MdcThemeModule,
    MdcToolbarModule,
    MdcTypographyModule
  ],
  declarations: []
})
export class MdcModule { }
