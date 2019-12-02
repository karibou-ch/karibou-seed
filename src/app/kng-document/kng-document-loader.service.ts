import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { LoaderService, DocumentService } from 'kng2-core';
import { combineLatest, of } from 'rxjs';

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
    if(!route.params.slug){
      return combineLatest(this.$loader.ready(),of(null));
    }
    return combineLatest(
      this.$loader.ready(),
      this.$document.get(route.params['slug'])
    ).toPromise();
  }
}
