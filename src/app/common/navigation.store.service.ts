//

import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { take } from 'rxjs/operators';

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
    // console.log('---- DBG  KngNavigationStoreResolve.store',route.params.store);

    //
    // update store state
    if(route.params.store){
      this.$navigation.store = route.params.store;
    }

    //
    // store value is mandatory to enter in a market
    return new Promise(resolve => {
      this.$loader.readyWithStore(route.params.store)
        .pipe(take(1)) // auto.die after first emission
        .subscribe((loader) => {
          const [config, user] = loader;
          console.log('---- DBG  KngNavigationStoreResolve.loader',loader);
          this.$navigation.store = config.shared.hub.slug;
          resolve(loader);
        });
    });

  }
}
