import { RouteReuseStrategy } from '@angular/router/';
import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
export class CacheRouteReuseStrategy implements RouteReuseStrategy {
  storedRouteHandles = new Map<string, DetachedRouteHandle>();
  allowRetriveCache = {
    'category/:category': false,
    'category/:category/:child': false,
  };

  shouldReuseRoute(before: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // console.log('--DEBUG route before',this.getPath(before), ' current',this.getPath(curr), (this.getPath(before) === 'products/:sku/:title' && this.getPath(curr) === 'category/:category') );

    if (this.getPath(before) === 'products/:sku/:title' && this.getPath(curr) === 'category/:category') {

      this.allowRetriveCache['category/:category'] = true;
    } else {
      this.allowRetriveCache['category/:category'] = false;
    }

    if (this.getPath(before) === 'products/:sku/:title' && this.getPath(curr) === 'category/:category/:child') {
      this.allowRetriveCache['category/:category/:child'] = true;
    } else {
      this.allowRetriveCache['category/:category/:child'] = false;
    }

    return before.routeConfig === curr.routeConfig;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.storedRouteHandles.get(this.getPath(route)) as DetachedRouteHandle;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    if (this.allowRetriveCache[path]) {
      return this.storedRouteHandles.has(this.getPath(route));
    }

    return false;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    if (this.allowRetriveCache.hasOwnProperty(path)) {
      return true;
    }
    return false;
  }

  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
    this.storedRouteHandles.set(this.getPath(route), detachedTree);
  }

  private getPath(route: ActivatedRouteSnapshot): string {
    if (route.routeConfig !== null && route.routeConfig.path !== null) {
      return route.routeConfig.path;
    }
    return '';
  }
}