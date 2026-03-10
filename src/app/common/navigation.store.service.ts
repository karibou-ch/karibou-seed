//

import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { LoaderService } from 'kng2-core';
import { KngNavigationStateService } from './navigation.service';

// activate route only when store (and data) is ready!
@Injectable()
export class KngNavigationStoreResolve implements Resolve<Promise<any>> {
  constructor(
    private $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    private $router: Router
  ) { }

  private getCanonicalStoreUrl(requestedStore: string, canonicalStore: string): string {
    const navigation = this.$router.getCurrentNavigation();
    const currentUrl = navigation?.finalUrl?.toString()
      || navigation?.initialUrl?.toString()
      || (window.location.pathname + window.location.search + window.location.hash);

    if (!currentUrl || !requestedStore || !canonicalStore) {
      return currentUrl;
    }

    const escapedStore = requestedStore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return currentUrl.replace(
      new RegExp(`(^|/)store/${escapedStore}(?=/|$)`),
      '$1store/' + canonicalStore
    );
  }

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
          const requestedStore = route.params.store;
          const canonicalStore = config?.shared?.hub?.slug;
          console.log('---- DBG  KngNavigationStoreResolve.loader',loader);
          this.$navigation.store = canonicalStore;

          // If the requested store is an old alias, rewrite the URL to the canonical slug.
          if (requestedStore && canonicalStore && requestedStore !== canonicalStore) {
            const canonicalUrl = this.getCanonicalStoreUrl(requestedStore, canonicalStore);
            if (canonicalUrl && canonicalUrl !== this.$router.url) {
              this.$router.navigateByUrl(canonicalUrl, { replaceUrl: true });
            }
          }
          resolve(loader);
        });
    });

  }
}
