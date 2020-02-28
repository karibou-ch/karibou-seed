import { Component } from '@angular/core';
import { MetricsService } from './common/metrics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // RAVEN_JS="https://cdnjs.cloudflare.com/ajax/libs/raven.js/3.26.2/angular,console,require/raven.min.js";
  // SENTRY_JS = 'https://browser.sentry-cdn.com/4.4.2/bundle.min.js';
  // POLYFILL_SCROLL="https://cdnjs.cloudflare.com/ajax/libs/smooth-scroll/15.2.0/smooth-scroll.polyfills.min.js";

  constructor(
    // private swUpdate:SwUpdate
    private $mterics: MetricsService
  ) {
    //
    // init metric/funnel service
    this.$mterics.init();


    // if(this.swUpdate.isEnabled){
    //   this.swUpdate.available.subscribe(next=>{
    //     if(confirm("Une nouvelle version est disponible. Recharger la page?")){
    //       window.location.reload();
    //     }
    //   });
    // }

  }
}
