import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { KngNavigationStateService } from '../navigation.service';

@Component({
  selector: 'app-kng-empty-root',
  templateUrl: './kng-empty-root.component.html',
  styleUrls: ['./kng-empty-root.component.scss']
})
export class KngEmptyRootComponent  {

  private subscription$: Subscription;
  constructor(
    private $route: ActivatedRoute,
    private $navigation: KngNavigationStateService
  ) {
    this.subscription$ = new Subscription();
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
  }


}
