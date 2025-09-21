import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { DocumentService } from 'kng2-core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KngDocumentLoaderService implements Resolve<any> {
  constructor(
    public $document: DocumentService
  ) {

  }

  resolve(route: ActivatedRouteSnapshot) {
    return new Promise(resolve => {
      if (!route.params.slug) {
        return of(null);
      }
      return this.$document.get(route.params.slug).subscribe(resolve);
    });

  }
}
