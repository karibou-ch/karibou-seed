import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService, LoaderService, CartAction, AnalyticsService, Metrics, Hub } from 'kng2-core';
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
  metric_view_landing,
  metric_view_home,
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



  isAdmin: boolean;
  currentSource: string;
  uid:string;

  //
  //fbc => url from meta link ?="...."
  fbclid: string;

  //
  // fbp => fb.1.DATE.RND, build a custom FB unique identifier
  // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc
  fbp ="fb.1."+Date.now()+"."+(Math.random()*1000000000|0);


  constructor(
    private $loader: LoaderService,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $analytics: AnalyticsService
  ) { }


  parseUrlIdentifiers(){
    //
    // build a custom pixel marker for Meta (FB)
    try {
      this.fbp = localStorage.getItem('meta-fbp') || this.fbp;
      localStorage.setItem('meta-fbp',(this.fbp));
    } catch (err) {
    }


    this.currentSource = this.$route.snapshot.queryParamMap.get('target')||
                         this.$route.snapshot.queryParamMap.get('source') ||
                         this.$route.snapshot.queryParamMap.get('umt_source') || this.currentSource;

    this.fbclid = this.$route.snapshot.queryParamMap.get('fbclid') || this.fbclid;
    if(this.fbclid) {
      this.fbclid = this.fbp.split('.').slice(0, -1).join('.')+this.fbclid;
    }


    console.log('---DBG identifiers',this.fbclid,this.fbp)

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

      this.initGA();

      this.$loader.update().subscribe((ctx) => {
        //
        // AddToProducts
        if (ctx.state && ctx.state.action === CartAction.ITEM_ADD) {
          this.event(EnumMetrics.metric_add_to_card, {'amount': ctx.state.item.price,hub:ctx.state.item.hub});
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
    this.uid = uid;
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
    if(this.isAdmin){
      return false;
    }
    const origin = window.location.origin;
    // FIMXE use config instead of hardcodedw
    return true;//(origin.indexOf('evaletolab.ch') == -1) || (origin.indexOf('localhost') == -1);
  }

  getHost(name: string): any {
    // silently hang
    const _default: any = {
      fbq: function() {},
      ga: function() {},
      gtag: function() {}
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
    this.parseUrlIdentifiers();

    if (!this.isEnable() || this.isAdmin) {
//      return;
    }


    const params: any = {};
    const metrics:Metrics = {} as Metrics;
    // item:name
    // amount: CHF
    // plan: pro,normal,guest,vendor
    // hub
    if (options) {
      Object.assign(params, options);
    }

    if(this.currentSource) {
      metrics.source = this.currentSource;
    }

    //
    // memory store of current source
    else if(params.source) {
      metrics.source = this.currentSource = params.source;
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {  
      // PWA mode
      metrics.source = metrics.source || 'pwa';
    }      

    if(params.hub) {
      metrics.hub = params.hub;
    }

    //
    // server side tracking
    metrics.extra = {
      url:location.href,
      fbc:this.fbclid,
      fbp:this.fbp,
      user_agent: window.navigator.userAgent
    }

    console.log('---- DBG metrics',EnumMetrics[metric],metrics)

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
        gtag('event', 'page_view', { page_location: params.path, page_title: params.title });
        metrics.extra.event='ViewContent';
        if(options.action) {
          metrics.action=options.action;
          this.$analytics.push(metrics);  
        }
        break;
      case EnumMetrics.metric_view_home:
        metrics.action='home';
        metrics.extra.event='PageView';
        this.$analytics.push(metrics);
        break;
      case EnumMetrics.metric_account_login:
        gtag('event', 'login');
        break;
      case EnumMetrics.metric_account_create:
        gtag('event', 'sign_up');
        metrics.extra.event='CompleteRegistration';
        metrics.action='signup';
        this.$analytics.push(metrics);
        break;
      case EnumMetrics.metric_add_to_card:
        gtag('event', 'add_to_cart',{ currency:'CHF', value:params.amount });
        metrics.extra.event='AddToCart';
        metrics.action='cart';
        metrics.amount = params.amount;
        this.$analytics.push(metrics);
        break;
      case EnumMetrics.metric_order_sent:
        gtag('event', 'purchase',  {value: params.amount, currency: 'CHF'});        
        metrics.action='order';
        metrics.amount=params.amount;
        metrics.extra.event='Purchase';
        this.$analytics.push(metrics);

        break;
      case EnumMetrics.metric_order_payment:
        gtag('event', 'begin_checkout', {value: params.amount, currency: 'CHF'});
        metrics.action='checkout';
        metrics.amount=params.amount;
        metrics.extra.event='InitiateCheckout';
        this.$analytics.push(metrics);
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
