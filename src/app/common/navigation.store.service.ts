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
    // store value is mandatory to enter in a market
    this.$navigation.store = route.params['store'];
    return new Promise(resolve => {
      this.$loader.readyWithStore().subscribe((loader) => {
        resolve(loader);
      });
    });

  }
}
