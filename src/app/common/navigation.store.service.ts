//

import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { LoaderService } from 'kng2-core';
import { KngNavigationStateService } from './navigation.service';

// activate route only when store (and data) is ready!
@Injectable()
export class KngNavigationStoreResolve implements Resolve<Promise<any>> {
  constructor(
    private $loader: LoaderService,
    private $navigation: KngNavigationStateService
  ) { }
  resolve(route: ActivatedRouteSnapshot) {

    //
    // update store 
    //console.log('---- DBG  KngNavigationStoreResolve.store',route.params.store);

    if(!this.$navigation.store && route.params.store){
      this.$navigation.store = route.params.store;
    }

    //
    // store value is mandatory to enter in a market
    return new Promise(resolve => {
      this.$loader.readyWithStore().subscribe((loader) => {
        resolve(loader);
      });
    });

  }
}
