import { Injectable } from '@angular/core';

/**
 * Service pour sauvegarder et restaurer les positions de scroll
 * Utilisé avec RouteReuseStrategy pour préserver le scroll lors de la navigation
 */
@Injectable({
  providedIn: 'root'
})
export class ScrollStateService {
  private scrollPositions = new Map<string, number>();

  /**
   * Sauvegarde la position de scroll pour une route donnée
   */
  save(routeKey: string, scrollY?: number): void {
    const position = scrollY ?? window.scrollY;
    this.scrollPositions.set(routeKey, position);
    console.log('--DEBUG ScrollState SAVE', routeKey, position);
  }

  /**
   * Récupère la position de scroll sauvegardée
   */
  get(routeKey: string): number | null {
    const position = this.scrollPositions.get(routeKey);
    // console.log('--DEBUG ScrollState GET', routeKey, position);
    return position ?? null;
  }

  /**
   * Restaure la position de scroll pour une route donnée
   * @returns true si une position a été restaurée
   */
  restore(routeKey: string, delay: number = 0): boolean {
    const position = this.get(routeKey);
    console.log('--DEBUG ScrollState RESTORE attempt', routeKey, 'position=', position);
    if (position !== null) {
      if (delay > 0) {
        setTimeout(() => {
          window.scrollTo(0, position);
          console.log('--DEBUG ScrollState RESTORE (delayed)', routeKey, position);
        }, delay);
      } else {
        window.scrollTo(0, position);
        console.log('--DEBUG ScrollState RESTORE', routeKey, position);
      }
      return true;
    }
    return false;
  }

  /**
   * Supprime la position de scroll sauvegardée
   */
  clear(routeKey: string): void {
    this.scrollPositions.delete(routeKey);
  }

  /**
   * Supprime toutes les positions de scroll
   */
  clearAll(): void {
    this.scrollPositions.clear();
  }
}
