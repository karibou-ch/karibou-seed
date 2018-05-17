import { Injectable } from '@angular/core';
import { LoaderService, User, UserService } from 'kng2-core';
import { Observable } from "rxjs/Observable";
import { Router, CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KngNavigationStateService } from './navigation.service';

import { of } from 'rxjs/observable/of';
import { catchError } from 'rxjs/operators';


@Injectable()
export class IsAuthenticatedGard implements CanActivate, CanActivateChild {
  constructor(
    private $router: Router,
    private $navigation:KngNavigationStateService,
    private $user:UserService
    ) {}

  //this prevent user from entering dashboard component when not logged
  //use Observable to prevent error when refreshing the page
  //see issue : https://stackoverflow.com/questions/42677274/angular-2-route-guard-not-working-on-browser-refresh/42678548
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.$user.me().pipe(
      catchError(err=>of(this.$user.currentUser))
    ).toPromise().then(user=>{
      // console.log('------ IsAuthenticatedGard',user.display(),user.isAuthenticated())
      if(user.isAuthenticated()){
        return true;
      }
      //FIXME access this.$navigation.store bretzel 
      this.$router.navigate(['/store','bretzel','me','login']);
      return false;
    });    
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.canActivate(route, state);
  }


}

@Injectable()
export class IsWelcomeGard implements CanActivate,CanActivateChild{
  constructor(
    private $router: Router,
    private $navigation:KngNavigationStateService,
    private $user:UserService
    ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<boolean> {
    console.log('guard welcome');
    return this.$user.me().pipe(
      catchError(err=>of(this.$user.currentUser))
    ).toPromise().then(user=>{
      //console.log('------ IsWelcomeGard',user.isAuthenticated())
      if(!user.isAuthenticated()){
        return true;
      }
      //FIXME access this.$navigation.store bretzel 
      this.$router.navigate(['/store','bretzel']);
      return false;
    });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.canActivate(route, state);
  }
  
}

