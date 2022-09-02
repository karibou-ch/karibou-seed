import { NgModule } from '@angular/core';

//
// import material components
import {
  MdcDrawerModule,
  MdcListModule,
  MdcSnackbarModule,
  MdcTabBarModule,
  MdcTopAppBarModule
} from '@angular-mdc/web';


@NgModule({
  exports: [
    MdcDrawerModule,
    MdcListModule,
    MdcSnackbarModule,
    MdcTabBarModule,
    MdcTopAppBarModule
  ],
  declarations: []
})
export class CommonMdcModule { }
