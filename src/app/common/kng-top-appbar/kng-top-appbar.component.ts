import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';

/**
 * KngTopAppbarComponent
 *
 * Container de barre de navigation avec :
 * - Layout 3 colonnes (start | center | end)
 * - Sticky on scroll
 * - Ombre en bas lors du défilement
 *
 * Utilise les slots standards pour la projection de contenu :
 * - slot="secondary" : Ligne secondaire (optionnelle)
 * - slot="start"     : Colonne gauche
 * - slot="center"    : Colonne centrale
 * - slot="end"       : Colonne droite
 *
 * @example
 * <kng-top-appbar>
 *   <div slot="secondary">Actions secondaires</div>
 *   <div slot="start">Logo + Navigation</div>
 *   <div slot="center">Titre</div>
 *   <div slot="end">Panier</div>
 * </kng-top-appbar>
 */
@Component({
  selector: 'kng-top-appbar',
  templateUrl: './kng-top-appbar.component.html',
  styleUrls: ['./kng-top-appbar.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KngTopAppbarComponent implements AfterViewInit, OnDestroy {

  /** État du scroll pour l'ombre */
  isScrolled: boolean = false;

  private scrollThreshold = 10;

  constructor(private $cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.checkScroll();
  }

  ngOnDestroy(): void {}

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.checkScroll();
  }

  private checkScroll(): void {
    const scrolled = window.scrollY > this.scrollThreshold;
    if (scrolled !== this.isScrolled) {
      this.isScrolled = scrolled;
      this.$cdr.markForCheck();
    }
  }
}
