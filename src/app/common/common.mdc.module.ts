import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcSnackbarModule,
  MdcTopAppBarModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcSnackbarModule,
    MdcTopAppBarModule
  ],
  declarations: []
})
export class CommonMdcModule { }
