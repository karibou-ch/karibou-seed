import { Injectable } from '@angular/core';
import { UserService, LoaderService, CartAction } from 'kng2-core';
import { timer } from 'rxjs';
import { map, debounce } from 'rxjs/operators';

export enum EnumMetrics {
  metric_error,
  metric_account_create,
  metric_account_login,
  metric_account_forget_password,
  metric_add_to_card,
  metric_exception,
  metric_view_menu,
  metric_view_page,
  metric_view_proposal,
  metric_order_address,
  metric_order_payment,
  metric_order_sent,
  metric_order_feedback
}


@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  FB_PIXEL = '1633129600094162';


  isAdmin: boolean;

  constructor(
    private $loader: LoaderService,
    private $user: UserService
  ) { }

  initFB() {
    if (!this.isEnable() || (<any>window).fbq) {
      return;
    }

    //
    // FB
    (function (f?: any, b?: any, e?: any, v?: any, n?: any, t?: any, s?) {
      if (f.fbq) { return; } n = f.fbq = function () {
        n.callMethod ?
        n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      }; if (!f._fbq) { f._fbq = n; }
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window,
      document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    console.log('Metrics -- load FB', this.getHost('fbq'));


    this.getHost('fbq')('init', this.FB_PIXEL);
    this.getHost('fbq')('track', 'PageView');
  }

  initGA() {
    if (!this.isEnable() || (<any>window).ga) {
      return;
    }

    // https://support.google.com/tagmanager/answer/7582054?hl=fr&ref_topic=3441530
    // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
    console.log('Metrics -- load GTAG', this.getHost('gtag'));

  }


  init(when?) {
    if (!this.isEnable()) {
      return;
    }

    //
    // delay the loading to avoid bad user experience
    timer(when || 50).pipe(map(ctx => {

      console.log('Metrics -- init');
      // this.initKissmetrics();
      this.initFB();
      this.initGA();

      this.$loader.update().subscribe((ctx) => {
        //
        // AddToProducts
        if (ctx.state && ctx.state.action === CartAction.ITEM_ADD) {
          console.log('-- metrics.AddToProducts', ctx.state);
          this.event(EnumMetrics.metric_add_to_card, {'amount': ctx.state.item.price});
        }

        //
        // User metrics
        const user = ctx.user || this.$user.currentUser;
        if (user && user.id) {
          console.log('-- metrics.identitySet', user.id);
          this.isAdmin = user.isAdmin();
          return this.identitySet(user.id);
        }
      });
    })).subscribe();

  }

  identitySet(uid) {
    if (!this.isEnable()) {
      return;
    }
    this.getHost('gtag')('config', 'G-WQKN27KZGG', { 
      'user_id': uid 
    });
    
  }

  identityClear() {
    if (!this.isEnable()) {
      return;
    }
  }

  isEnable() {
    return (window.location.origin.indexOf('karibou.ch') > -1) && !this.isAdmin;
  }

  getHost(name: string): any {
    // silently hang
    const _default: any = {
      fbq: function() {},
      ga: function() {},
      gtag: function() {console.log('--- DBG gtag',arguments)},
      _kmq: {push: function() {}}
    };
    return ((<any>window)[name]) || _default[name];
  }

  error() {
  }


  page(path: string) {
    if (this.isAdmin) {
      return;
    }

    //this.getHost('ga')('send', 'pageview', { page: path });
    this.getHost('fbq')('track', 'PageView');
  }

  //
  // metrics
  // - signed
  // - login
  // - addToCard
  // - ViewContent
  // - order:address
  // - order:payment
  // - order:sent (amount)
  // - order:feedback
  event(metric: EnumMetrics, options?) {
    const gtag = this.getHost('gtag');
    const fbq = this.getHost('fbq');

    if (!this.isEnable() || this.isAdmin) {
      return;
    }
    const params: any = {};

    // item:name
    // amount: CHF
    // plan: pro,normal,guest,vendor
    if (options) {
      Object.assign(params, options);
    }


    //
    // sent event
    // kmq.push(['record', EnumMetrics[metric], params]);

    // google
    // ga('send', 'event', [category], [Action], [Label], [Value], [fieldsObject]);
    // gtag('event', [category], [Action], [Label], [Value], [fieldsObject]);
    // ga4 ecommerce
    // https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#view_cart

    switch (metric) {      
      case EnumMetrics.metric_view_page:
        fbq('track', 'ViewContent');
        //gtag('event', 'pageview', { page: params.path });
        break;
      case EnumMetrics.metric_view_proposal:
        //gtag('event', 'user', 'proposal');
        break;
      case EnumMetrics.metric_view_menu:
        //gtag('event', 'user', 'menu');
        break;
      case EnumMetrics.metric_account_login:
        gtag('event', 'user', 'login');
        break;
      case EnumMetrics.metric_account_create:
        fbq('track', 'CompleteRegistration');
        gtag('event', 'user', 'CompleteRegistration');
        break;
      case EnumMetrics.metric_add_to_card:
        fbq('track', 'AddToCart', params.amount);
        gtag('event', 'add_to_cart',{ currency:'CHF', value:params.amount });
        break;
      case EnumMetrics.metric_order_sent:
        fbq('track', 'Purchase', {value: params.amount, currency: 'CHF'});
        gtag('event', 'purchase',  {value: params.amount, currency: 'CHF'});        
        break;
      case EnumMetrics.metric_order_payment:
        fbq('track', 'InitiateCheckout');
        gtag('event', 'begin_checkout', {value: params.amount, currency: 'CHF'});
        break;
        case EnumMetrics.metric_error:
        case EnumMetrics.metric_exception:
            gtag('event', 'exception', {
          'description': params.message||params.error,
          'fatal': false
        });
        
    }
  }
}

