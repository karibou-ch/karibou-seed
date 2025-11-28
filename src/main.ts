import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
// import 'hammerjs';

if (environment.production) {
  enableProdMode();
}

// Web Awesome Components - Imports pour kng-top-appbar
import './app/common/kng-top-appbar/kng-top-appbar.awesome';


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
