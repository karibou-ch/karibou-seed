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
  metric_view_page, 
  metric_order_address,
  metric_order_payment,
  metric_order_sent,
  metric_order_feedback
}


@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  FB_PIXEL="142141582812801";


  isAdmin:boolean;

  constructor(
    private $loader:LoaderService,
    private $user:UserService
  ) { }

  initFB(){    
    if(!this.isEnable() || (<any>window).fbq){
      return;
    }

    //
    // FB
    (function (f?:any, b?:any, e?:any, v?:any, n?:any, t?:any, s?) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ?
        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }; if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    })(window,
      document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');    

    console.log('Metrics -- load FB',this.getHost('fbq'));


    // ORIGINAL O.E.
    this.getHost('fbq')('init', this.FB_PIXEL);
    this.getHost('fbq')('track', 'PageView');
  }

  initGA(){
    if(!this.isEnable() || (<any>window).ga){
      return;
    }
    

    (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * (<any>new Date()); a = s.createElement(o),
      m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    // (<any>window).ga('require', 'displayfeatures');
    // (<any>window).ga('create', 'UA-57032730-1', 'auto');
    this.getHost('ga')('require', 'displayfeatures');
    this.getHost('ga')('create', 'UA-57032730-1', 'auto');
    this.getHost('ga')('send', 'pageview');

    console.log('Metrics -- load GA',this.getHost('ga'));

  }

  //
  // DEPRECATED kissmetric is loaded on preload.js (check config at angular.json)
  // initKissmetrics(){
  //   var _kmk = _kmk || 'b86f4d476760eff81deae793f252b30c49d3dee2';
  //   function _kms(u){
  //     setTimeout(function(){
  //       var d = document, f = d.getElementsByTagName('script')[0],
  //       s = d.createElement('script');
  //       s.type = 'text/javascript'; s.async = true; s.src = u;
  //       f.parentNode.insertBefore(s, f);
  //     }, 1);
  //   }
  //   _kms('//i.kissmetrics.com/i.js');
  //   _kms('//scripts.kissmetrics.com/' + _kmk + '.2.js');
  // }


  init(when?){
    if(!this.isEnable()){
      return;
    }

    //
    // delay the loading to avoid bad user experience
    timer(when||500).pipe(map(ctx=>{

      console.log('Metrics -- init');
      // this.initKissmetrics();
      this.initFB();
      this.initGA();
      
      this.$loader.update().subscribe((ctx)=>{
        //
        // AddToProducts
        if(ctx.state&&ctx.state.action==CartAction.ITEM_ADD){
          console.log('-- metrics.AddToProducts',ctx.state);
          this.event(EnumMetrics.metric_add_to_card,{'amount':ctx.state.item.price});
        }

        //
        // User metrics
        let user=ctx.user||this.$user.currentUser
        if(user&&user.id){
          console.log('-- metrics.identitySet',user.id);
          this.isAdmin=user.isAdmin();
          return this.identitySet(user.email.address);
        }
      });
    })).subscribe();
    
  }

  identitySet(uid){
    if(!this.isEnable()){
      return;
    }
    this.getHost('ga')('set', '&uid', uid);
    //this.getHost('_kmq').push(['identify', uid])
  }
  
  identityClear(){
    if(!this.isEnable()){
      return;
    }
    // this.getHost('_kmq').push(['clearIdentity']);
    // this.getHost('ga').push(['clearIdentity']);
  }

  isEnable(){
    return (window.location.origin.indexOf('karibou.ch')>-1)&&!this.isAdmin;
  }

  getHost(name:string):any{
    // silently hang
    let _default:any={
      fbq:function(){},
      ga:function(){},
      _kmq:{push:function(){}}
    };
    return ((<any>window)[name])||_default[name];    
  }

  error(){
  }


  page(path:string){
    this.getHost('ga')('send', 'pageview', { page: path });
    this.getHost('fbq')('track', "PageView");
  }

  //
  // metrics
  // - signed
  // - login
  // - addToCard
  // - viewPage (category-subcategory)
  // - order:address
  // - order:payment
  // - order:sent (amount) 
  // - order:feedback
  event(metric:EnumMetrics,options?){
    let ga=this.getHost('ga');
    let fbq=this.getHost('fbq');

    if(!this.isEnable()){
      return;
    }
    let params:any={};

    // item:name
    // amount: CHF
    // plan: pro,normal,guest,vendor
    if(options){
      Object.assign(params,options);
    }


    //
    // sent event
    //kmq.push(['record', EnumMetrics[metric], params]);
  
    // google
    // ga('send', 'event', [category], [Action], [Label], [Value], [fieldsObject]);

    switch(metric){
      case EnumMetrics.metric_account_login:
        ga('send', 'event', 'user','login');
        break;
      case EnumMetrics.metric_account_create:
        fbq('track', 'CompleteRegistration');
        ga('send', 'event', 'user','CompleteRegistration');
        break;
      case EnumMetrics.metric_add_to_card:
        fbq('track', 'AddToCart', params.amount);
        ga('send', 'event', 'order','AddToCart','', params.amount);
        break;
      case EnumMetrics.metric_order_sent:
        fbq('track', 'Purchase', {value: params.amount, currency:'CHF'});
        ga('send', 'event', 'order','Purchase', '', params.amount);
        break;
      case EnumMetrics.metric_order_payment:
        fbq('track', 'InitiateCheckout');
        ga('send','event', 'order','InitiateCheckout');
        break;
    }    
  }
}

