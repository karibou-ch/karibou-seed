import { Injectable } from '@angular/core';
import { config, ConfigService, User, UserService } from 'kng2-core';
import { Observable ,  of } from 'rxjs';
import { Router, CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KngNavigationStateService } from './navigation.service';
import { catchError, map } from 'rxjs/operators';

//
// force lookup for store value because CanActivate parent is not called at this stage
const paramLookup = (name) => {
  const fragments = window.location.pathname.split('/');
  const idx = fragments.findIndex(f => f === name);
  return (idx === -1 ) ? 'artamis' : fragments[idx + 1];
};


@Injectable()
export class IsAuthenticatedGard implements CanActivate, CanActivateChild {
  constructor(
    private $router: Router,
    private $navigation: KngNavigationStateService,
    private $user: UserService
    ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.$user.me().pipe(
      map(user => {
        console.log('------ IsAuthenticatedGard', user.display(), user.isAuthenticated(), user.reminder);
        if (user.isAuthenticated()) {
          return true;
        }
        const store = this.$navigation.store || paramLookup('store');
        this.$router.navigate(['/store', store, 'me', 'login']);
        return false;
      })
    ).toPromise();
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.canActivate(route, state);
  }
}

@Injectable()
export class IsWelcomeGard implements CanActivate, CanActivateChild {
  constructor(
    private $router: Router,
    private $navigation: KngNavigationStateService,
    private $user: UserService,
    private $config: ConfigService
    ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const user$ = this.$user.me().pipe(
      catchError(err => of(new User()))
    ).toPromise();
    return user$.then(user => {
      if (!user.isAuthenticated()) {
        return true;
      }
      //
      // FIXME, the default HUB value should only be managed by $navigation service
      // if (user.reminder && user.reminder.defaultHub) {
      //   this.$navigation.store = user.reminder.defaultHub;
      // }
      const store = this.$navigation.store || paramLookup('store');
      console.log('------ IsWelcomeGard', user.display(), user.isAuthenticated(),store);
      if(store) {
        this.$router.navigate(['/store', store, 'home']);
      }
      
      return true;
    });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.canActivate(route, state);
  }

}
