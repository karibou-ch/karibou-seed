import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Sentry bundle size
// https://github.com/getsentry/sentry-javascript/issues/1552
import * as Sentry from '@sentry/browser';
import pkgInfo from '../../../package.json';


//
// FIXME use chunk js module to load Sentry (50kb) only on demand
window['Sentry'] = window['Sentry'] || Sentry;
Sentry.init({
  dsn: 'https://9457c6b1c4e343b8b1aa7e74642147e0@o9343.ingest.sentry.io/1360987',
  release: pkgInfo.version
});

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class SentryModule {
  constructor() {}

  Sentry() {
    return Sentry;
  }
}
