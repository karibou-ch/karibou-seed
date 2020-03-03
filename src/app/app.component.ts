import { Component } from '@angular/core';
import { MetricsService } from './common/metrics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // SENTRY_JS = 'https://browser.sentry-cdn.com/5.12.5/bundle.min.js';

  constructor(
    // private swUpdate:SwUpdate
    private $mterics: MetricsService
  ) {
    //
    // init metric/funnel service
    this.$mterics.init();

    //
    // install sentry backend delegate the load bundle
    // https://github.com/getsentry/sentry-javascript/issues/1552
    // CORS in browser will soon reject this call
    // Utils.script(this.SENTRY_JS, 'Sentry').subscribe((Sentry: any) => {
    //   Sentry.init({
    //     dsn: 'https://9457c6b1c4e343b8b1aa7e74642147e0@sentry.io/1360987',
    //     release: version
    //   });
    // });

    // if(this.swUpdate.isEnabled){
    //   this.swUpdate.available.subscribe(next=>{
    //     if(confirm("Une nouvelle version est disponible. Recharger la page?")){
    //       window.location.reload();
    //     }
    //   });
    // }

  }
}
