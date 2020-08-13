import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { LoaderService, DocumentService } from 'kng2-core';
import { combineLatest, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KngDocumentLoaderService implements Resolve<any> {
  constructor(
    public $document: DocumentService,
    private $loader: LoaderService
  ) {

  }

  resolve(route: ActivatedRouteSnapshot) {
    return new Promise(resolve => {
      if (!route.params.slug) {
        return combineLatest([this.$loader.readyWithStore(), of(null)]).subscribe(resolve);
      }
      combineLatest([
        this.$loader.readyWithStore(),
        this.$document.get(route.params['slug'])
      ]).subscribe(resolve);
    });

  }
}
