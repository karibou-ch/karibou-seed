import {
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input
} from '@angular/core';
import { Subscription } from 'rxjs';
import { KngNavigationStateService } from '../navigation.service';

/**
 * KngAppbarComponent
 *
 * Container de barre de navigation avec :
 * - Layout 3 colonnes (start | center | end)
 * - Sticky on scroll
 * - Ombre en bas lors du défilement
 * - Position configurable (top/bottom) pour mobile
 *
 * Utilise les slots standards pour la projection de contenu :
 * - slot="secondary" : Ligne secondaire (optionnelle)
 * - slot="start"     : Colonne gauche
 * - slot="center"    : Colonne centrale
 * - slot="end"       : Colonne droite
 *
 * @example
 * <kng-appbar position="top">
 *   <div slot="secondary">Actions secondaires</div>
 *   <div slot="start">Logo + Navigation</div>
 *   <div slot="center">Titre</div>
 *   <div slot="end">Panier</div>
 * </kng-appbar>
 *
 * <kng-appbar position="bottom">
 *   <div slot="center">Bottom bar mobile</div>
 * </kng-appbar>
 */
@Component({
  selector: 'kng-appbar',
  templateUrl: './kng-appbar.component.html',
  styleUrls: ['./kng-appbar.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngAppbarComponent implements OnInit, OnDestroy {

  /**
   * Position de la navbar
   * - 'top': Position en haut (défaut)
   * - 'bottom': Position en bas de l'écran
   */
  @Input() position: 'top' | 'bottom' = 'top';

  /** État du scroll pour l'ombre */
  isScrolled: boolean = false;

  /** Direction du scroll (-1 = down, 1 = up, 0 = idle) */
  scrollDirection: number = 0;

  private scrollThreshold = 10;
  private subscription = new Subscription();

  constructor(
    private $cdr: ChangeDetectorRef,
    private $navigation: KngNavigationStateService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.$navigation.registerScrollEvent$().subscribe(scroll => {
        this.scrollDirection = scroll.direction;
        //this.isScrolled = (this.position === 'top') ? this.scrollDirection < 0 : this.scrollDirection > 0;
        this.isScrolled = this.scrollDirection < 0 && (this.position === 'top');
        this.$cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
