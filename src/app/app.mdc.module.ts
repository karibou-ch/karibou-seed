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
  MdcIconToggleModule,  
  MdcListModule,
  MdcMenuModule,
  MdcRippleModule,
  MdcTabModule,
  MdcThemeModule,
  MdcTextFieldModule,
  MdcToolbarModule
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
    MdcIconToggleModule,
    MdcListModule,
    MdcMenuModule,
    MdcRippleModule,
    MdcTextFieldModule,
    MdcTabModule,
    MdcThemeModule,
    MdcToolbarModule
  ],
  declarations: []
})
export class MdcModule { }
