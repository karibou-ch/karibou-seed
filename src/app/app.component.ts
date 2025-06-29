import { Component, OnDestroy } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';

import { MetricsService } from './common/metrics.service';
import { i18n } from './common';
import { LoaderService } from 'kng2-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

  // SENTRY_JS = 'https://browser.sentry-cdn.com/5.12.5/bundle.min.js';
  private subscription$ = new Subscription();

  i18n: any = {
    fr: {
      reload: 'Une nouvelle version est disponible. Recharger la page maintenant'
    },
    en: {
      reload: 'A new version is available. Reload the page now'
    }
  };

  constructor(
    private $loader: LoaderService,
    private $i18n: i18n,
    private $update: SwUpdate,
    private $metrics: MetricsService
  ) {

    //
    // init metric/funnel service
    this.$metrics.init();

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
    this.subscription$.add(
      this.$update.available.subscribe(event => {
        const local = this.$i18n.locale;
        alert(this.i18n[local].reload);
        this.$update.activateUpdate().then(() => window.location.reload());
      })
    );

    //
    // load config on boot
    this.$loader.ready().toPromise().then();

  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }
}
