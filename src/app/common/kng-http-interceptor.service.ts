import { Injectable } from '@angular/core';
import { UserService } from 'kng2-core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { i18n } from './i18n.service';
import { MetricsService, EnumMetrics } from './metrics.service';
import { KngNavigationStateService } from './navigation.service';


export class ErrorState {
  message: string;
  status: number;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class KngHttpInterceptorService {

  CONFIRM_RUNNING: boolean;
  error$: Subject<ErrorState>;

  constructor(
    public $i18n: i18n,
    public $metric: MetricsService,
    public $navigation: KngNavigationStateService,
    public $user: UserService
  ) {
    this.error$ = new Subject();
    this.CONFIRM_RUNNING = false;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // TODO IMPLEMENT JWT HERE
    // JWT
    // - https://ryanchenkie.com/angular-authentication-using-the-http-client-and-http-interceptors
    // - https://blog.angular-university.io/angular-jwt-authentication/
    //
    // if(this.$user.currentUser['token']){
    //   request = request.clone({
    //     setHeaders: {
    //       Authorization: `Bearer ${this.$user.currentUser['token']}`
    //     }
    //   });
    // }

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        //
        // OK
      }, (err: HttpErrorResponse) => {
        //
        // on logout error
        if(err.status == 0 && 
           err.url && err.url.indexOf('logout')>-1) {
          return;
        }
        //
        // on Unknow ERROR (Caused by Network ERROR or CORS error)
        else if(err.status == 0) {
          const label_error = this.$i18n.label().action_error_reload;
          console.log('ERROR(0)', err.message, 'ERROR:', err);
          this.error$.next({message: err.message, status: err.status, url: err.url} as ErrorState );

          if (!this.CONFIRM_RUNNING) {
            this.CONFIRM_RUNNING = true;
            setTimeout(() => {
              if (confirm(label_error)) {
                window.location.reload(true);
              }
              this.CONFIRM_RUNNING = false;
            }, 1000);
          }

          this.$metric.event(EnumMetrics.metric_error, {message:err.message});

        }

        //
        // on Unauthorized ERROR
        if (err.status === 401) {
          this.$navigation.debounceLogout();
          this.error$.next({message: err.message, status: err.status, url: err.url} as ErrorState );
        }
      })
    );
  }

}


