import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

import { MetricsService } from './common/metrics.service';
import { i18n } from './common';
import { LoaderService } from 'kng2-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // SENTRY_JS = 'https://browser.sentry-cdn.com/5.12.5/bundle.min.js';
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
    private $mterics: MetricsService
  ) {
    //
    // FIXME, avoid context menu on full application (but only needed on audio record)
    window.oncontextmenu = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };    

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
    this.$update.available.subscribe(event => {
      const local = this.$i18n.locale;
      alert(this.i18n[local].reload);
      this.$update.activateUpdate().then(() => document.location.reload(true));
    });

    //
    // load config on boot
    this.$loader.ready().toPromise().then();

  }
}
