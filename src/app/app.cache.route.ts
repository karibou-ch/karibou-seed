import { RouteReuseStrategy } from '@angular/router/';
import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

//
// FIXME RouteReuseStrategy
// https://itnext.io/cache-components-with-angular-routereusestrategy-3e4c8b174d5f
// https://stackoverflow.com/a/41515648
export class CacheRouteReuseStrategy implements RouteReuseStrategy {
  storedRouteHandles = new Map<string, DetachedRouteHandle>();
  allowRetriveCache = {
    'category/:category': false,
    'category/:category/:child': false
  };

  allowCache = {
    'home': false,
    'cellar': false,
    'wellness': false,
    'selection': false
  };


  /**
   * VALIDITY
   */

  /**
   * => When true it actually reuses the route you're currently on and none of the other methods are fired.
   * Determines whether or not the current route should be reused
   * @param future The route the user is going to, as triggered by the router
   * @param curr The route the user is currently on
   * @returns boolean basically indicating true if the user intends to leave the current route
   */
  shouldReuseRoute(before: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    //
    // ONLY AVAILABLE FOR /HOME/
    const result = (before.routeConfig === curr.routeConfig);
    const path = this.getPath(curr);



    this.allowRetriveCache['category/:category'] = (this.getPath(before) === 'products/:sku/:title' &&
                                                    path === 'category/:category');

    this.allowRetriveCache['category/:category/:child'] = (this.getPath(before) === 'products/:sku/:title' &&
                                                           path === 'category/:category/:child');

    // if(this.allowRetriveCache['category/:category/:child'] || this.allowRetriveCache['category/:category']) {
    //   console.log('--DEBUG shouldReuseRoute', this.getPath(before), ' current', path);
    // }

    //
    // when changing departement
    // clear Caches
    if (['home', 'cellar', 'selection', 'wellness'].indexOf(path) > -1) {
      if (Object.values(this.allowCache).some(value => value) && !this.allowCache[path]) {
        Object.keys(this.allowCache).forEach(key => this.allowCache[key] = false);
        this.storedRouteHandles.clear();
      }
      this.allowCache[path] = true;
    }

    return result;
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
    const retrieve = !!(this.allowRetriveCache[path] && this.storedRouteHandles.has(path));
    //console.log('--DEBUG shouldAttach ', path, ': fire retrieve', retrieve);
    return retrieve;
  }

  /**
   * => This method is called if shouldAttach returns TRUE,
   * It is invoked when we leave the current route. If returns TRUE then the store method will be invoked:
   * @param route New route the user has requested
   * @returns DetachedRouteHandle object which can be used to render the component
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    //console.log('--DEBUG retrieve', this.getPath(route));
    return this.storedRouteHandles.get(this.getPath(route)) as DetachedRouteHandle;
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
    const store = !!(this.allowRetriveCache.hasOwnProperty(path));
    //console.log('--DEBUG shouldDettach ', path, ': fire STORE', store);
    return store;
  }
  /**
   * This method is invoked only if the shouldDetach returns true. 
   * We can manage here how to store the RouteHandle. What we store here will be used in the retrieve method.
   * @param route 
   * @param detachedTree 
   */
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
    const path = this.getPath(route);
    //console.log('--DEBUG store', path);
    this.storedRouteHandles.set(path, detachedTree);
  }

  //
  // FORCED in home,cellar,selection,wellness
  private getPath(route: ActivatedRouteSnapshot): string {
    if (route.routeConfig !== null && route.routeConfig.path !== null) {
      return route.routeConfig.path;
    }
    return '';
  }
}