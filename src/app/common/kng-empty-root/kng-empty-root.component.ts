import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { KngNavigationStateService } from '../navigation.service';

/**
 * KngNavbarWrapperComponent (anciennement KngEmptyRootComponent)
 *
 * Composant wrapper simple qui fournit:
 * - La navbar (kng-navbar)
 * - Un router-outlet pour les routes enfants
 *
 * Utilisé comme composant parent pour toutes les routes sous /store/:store
 */
@Component({
  selector: 'kng-navbar-wrapper',
  templateUrl: './kng-empty-root.component.html',
  styleUrls: ['./kng-empty-root.component.scss']
})
export class KngNavbarWrapperComponent implements OnDestroy {

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

/**
 * @deprecated Utilisez KngNavbarWrapperComponent à la place
 */
export { KngNavbarWrapperComponent as KngEmptyRootComponent };
