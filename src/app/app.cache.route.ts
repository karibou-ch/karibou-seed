import { RouteReuseStrategy } from '@angular/router/';
import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Injectable } from "@angular/core";

/**
 * CacheRouteReuseStrategy - Stratégie de cache pour Angular Router
 * 
 * ## Objectif
 * Préserver l'état des composants (DOM + scroll) lors de la navigation,
 * notamment pour le pattern "liste → détail → retour liste".
 * 
 * ## Flux de fonctionnement
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         NAVIGATION                              │
 * │                                                                 │
 * │  1. QUITTER une route (ex: home → product)                      │
 * │     └─ shouldDetach() → true = stocker la vue                   │
 * │        └─ Capture scrollY                                       │
 * │        └─ store() → storedRouteHandles.set(path, vue)           │
 * │                                                                 │
 * │  2. PENDANT la navigation                                       │
 * │     └─ shouldReuseRoute() → met à jour allowRetriveCache        │
 * │        Si on va de products → home: allowRetriveCache['home']=true│
 * │                                                                 │
 * │  3. ARRIVER sur une route (ex: products → home)                 │
 * │     └─ shouldAttach() → true si (allowRetriveCache && hasHandle)│
 * │        └─ retrieve() → retourne la vue cachée + restaure scroll │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Routes cachées
 * - `home` : Page d'accueil avec liste de produits
 * - `subscriptions` : Page des abonnements
 * - `category/:category` : Listes de catégories (enfants de home)
 * 
 * ## Condition de restauration
 * Le cache est restauré UNIQUEMENT quand on revient depuis une route produit
 * (`products/:sku` ou `products/:sku/:title`) vers une route cacheable.
 * 
 * @see https://itnext.io/cache-components-with-angular-routereusestrategy-3e4c8b174d5f
 * @see https://stackoverflow.com/a/41515648
 */
@Injectable()
export class CacheRouteReuseStrategy implements RouteReuseStrategy {
  // Cache des composants détachés (vue complète)
  storedRouteHandles = new Map<string, DetachedRouteHandle>();
  
  // Cache des positions de scroll associées aux routes
  private scrollPositions = new Map<string, number>();
  
  // Routes qui peuvent être restaurées depuis le cache
  // La valeur passe à `true` quand on navigue FROM products VERS cette route
  allowRetriveCache = {
    'category/:category': false,
    'category/:category/:child': false,
    'home': false,
    'subscriptions': false
  };

  clearCache() {
    this.storedRouteHandles.clear();
    this.scrollPositions.clear();
    // Reset tous les flags de restauration
    Object.keys(this.allowRetriveCache).forEach(key => this.allowRetriveCache[key] = false);
  }


  /**
   * VALIDITY
   */

  /**
   * => When true it actually reuses the route you're currently on and none of the other methods are fired.
   * Determines whether or not the current route should be reused
   * @param future The route the user is going to, as triggered by the router
   * @param curr The route the user is currently on
   * @returns boolean basically indicating true if the user intends to leave the current route
   * @issue https://github.com/angular/angular/issues/41012
   */
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const result = (future.routeConfig === curr.routeConfig);
    const futurePath = this.getPath(future);
    const currPath = this.getPath(curr);

    // ============================================================================
    // CACHE POUR NAVIGATION: home/subscriptions <-> products
    // ============================================================================
    
    // Quand on revient de products vers home
    this.allowRetriveCache['home'] = (
      this.isProductRoute(currPath) && futurePath === 'home'
    );

    // Quand on revient de products vers subscriptions
    this.allowRetriveCache['subscriptions'] = (
      this.isProductRoute(currPath) && futurePath === 'subscriptions'
    );

    // ============================================================================
    // CACHE: category <-> products (navigation dans les listes de produits)
    // ============================================================================
    this.allowRetriveCache['category/:category'] = (
      this.isProductRoute(currPath) && futurePath === 'category/:category'
    );

    this.allowRetriveCache['category/:category/:child'] = (
      this.isProductRoute(currPath) && futurePath === 'category/:category/:child'
    );

    return result;
  }

  /**
   * Vérifie si le path est une route produit
   */
  private isProductRoute(path: string): boolean {
    return path === 'products/:sku/:title' || path === 'products/:sku';
  }

  /**
   * RESTORE
   */

  /**
   * This method is called for the route just opened when we land on the component of this route.
   * Once component is loaded this method is called.
   * If this method returns TRUE then retrieve method will be called,
   * otherwise the component will be created from scratch:
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    const hasHandle = this.storedRouteHandles.has(path);
    return !!(this.allowRetriveCache[path] && hasHandle);
  }

  /**
   * => This method is called if shouldAttach returns TRUE,
   * It is invoked when we leave the current route. If returns TRUE then the store method will be invoked:
   * @param route New route the user has requested
   * @returns DetachedRouteHandle object which can be used to render the component
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = this.getPath(route);
    const handle = this.storedRouteHandles.get(path) as DetachedRouteHandle;
    
    // Restaurer la position de scroll après réattachement du DOM
    const scrollY = this.scrollPositions.get(path);
    console.log('--DEBUG retrieve', path, 'scrollY=', scrollY);
    if (scrollY !== undefined && scrollY > 0) {
      setTimeout(() => window.scrollTo(0, scrollY), 50);
    }
    
    return handle;
  }

  /**
   * STORE
   */

  /**
   * IF shouldReuseRoute returns false,
   * => shouldDetach fires and should determines whether or not you want to store the route, 
   * => and returns a boolean indicating as much. This is where you should decide to store/not to store paths
   * @param route This is, at least as I understand it, the route that the user is currently on, and we would like to know if we want to store it
   * @returns boolean indicating that we want to (true) or do not want to (false) store that route
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    
    // Stocker home/subscriptions quand on les quitte (pour restauration via retrieve)
    if (path === 'home' || path === 'subscriptions') {
      // Capturer le scroll AVANT la navigation (sinon Angular le réinitialise)
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement?.scrollTop || 0;
      console.log('--DEBUG shouldDetach', path, 'scrollY=', scrollY);
      this.scrollPositions.set(path, scrollY);
      return true;
    }
    
    // Stocker aussi les routes category (navigation dans les listes)
    return !!(this.allowRetriveCache.hasOwnProperty(path));
  }
  /**
   * This method is invoked only if the shouldDetach returns true. 
   * We can manage here how to store the RouteHandle. What we store here will be used in the retrieve method.
   * @param route 
   * @param detachedTree 
   */
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
    const path = this.getPath(route);
    this.storedRouteHandles.set(path, detachedTree);
  }

  /**
   * Extrait le path de la route pour l'utiliser comme clé de cache
   */
  private getPath(route: ActivatedRouteSnapshot): string {
    if (route.routeConfig !== null && route.routeConfig.path !== null) {
      const path = route.routeConfig.path;
      
      // Pour les modules lazy-loaded avec path: '', on cherche dans le path du parent
      if (path === '' && route.parent?.routeConfig?.path) {
        return route.parent.routeConfig.path;
      }
      
      return path;
    }
    return '';
  }
}