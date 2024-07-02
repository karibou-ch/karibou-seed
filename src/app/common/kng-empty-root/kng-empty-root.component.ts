import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { KngNavigationStateService } from '../navigation.service';

@Component({
  selector: 'app-kng-empty-root',
  templateUrl: './kng-empty-root.component.html',
  styleUrls: ['./kng-empty-root.component.scss']
})
export class KngEmptyRootComponent implements OnInit {

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

  ngOnInit(): void {
    this.subscription$.add(
      this.$route.params.subscribe(params => {
      if(!params.store) {
        return;
      }
      this.$navigation.store = params['store'];
    }));

  }

}
