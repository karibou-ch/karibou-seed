import { Injectable } from '@angular/core';
import { LoaderService, User, UserService } from 'kng2-core';
import { Observable } from "rxjs/Observable";
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NavigationService } from './navigation.service';

@Injectable()
export class IsAuthenticatedGard implements CanActivate{
  constructor(
    private $router: Router,
    private $navigation:NavigationService,
    private $user:UserService
    ) {}

  //this prevent user from entering dashboard component when not logged
  //use Observable to prevent error when refreshing the page
  //see issue : https://stackoverflow.com/questions/42677274/angular-2-route-guard-not-working-on-browser-refresh/42678548
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if(!this.$user.currentUser.isAuthenticated()){
      
      this.$router.navigate(['/store',this.$navigation.store,'me','/login'], { queryParams: { from: state.url }});
      return false;
    }
    return true;        
  }
}

