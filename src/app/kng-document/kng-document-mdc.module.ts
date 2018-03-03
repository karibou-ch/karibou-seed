import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcButtonModule,
  MdcCheckboxModule,
  MdcElevationModule,
  MdcFabModule,
  MdcFormFieldModule,
  MdcIconModule,
  MdcIconToggleModule,  
  MdcSnackbarModule,
  MdcTextFieldModule  
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcButtonModule,
    MdcCheckboxModule,
    MdcElevationModule,
    MdcFabModule,
    MdcFormFieldModule,
    MdcIconModule,
    MdcIconToggleModule,  
    MdcSnackbarModule,
    MdcTextFieldModule
  ],
  declarations: []
})
export class KngDocumentMdcModule { }
