import { Injectable } from '@angular/core';
import { UserService, LoaderService } from 'kng2-core';
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

  isAdmin:boolean;

  constructor(
    private $loader:LoaderService,
    private $user:UserService
  ) { }

  initFB(){    
    if(!this.isEnable()){
      return;
    }

    //   !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    //   n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    //   n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    //   t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    //   document,'script','https://connect.facebook.net/en_US/fbevents.js');

    //   // ORIGINAL O.E. 
    //   fbq('init', '142141582812801');
    //   fbq('track', 'PageView');
  }

  initGA(){
    if(!this.isEnable()){
      return;
    }
    //   (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    //   (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    //   m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    //   })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    //   ga('require', 'displayfeatures');
    //   ga('create', 'UA-57032730-1', 'auto');
  }

  initKissmetrics(){
    var _kmk = _kmk || 'b86f4d476760eff81deae793f252b30c49d3dee2';
    function _kms(u){
      setTimeout(function(){
        var d = document, f = d.getElementsByTagName('script')[0],
        s = d.createElement('script');
        s.type = 'text/javascript'; s.async = true; s.src = u;
        f.parentNode.insertBefore(s, f);
      }, 1);
    }
    _kms('//i.kissmetrics.com/i.js');
    _kms('//scripts.kissmetrics.com/' + _kmk + '.2.js');
  }


  init(when?){
    if(!this.isEnable()){
      return;
    }

    timer(when||1000).pipe(map(ctx=>{
      this.initKissmetrics();

      //
      // give times to backend to be loaded
      this.$loader.update()
      .pipe(debounce(() => timer(1000)))
      .subscribe((ctx:any)=>{
        //
        // AddToProducts
        if(ctx.state&&ctx.state.action==1){
          this.event(EnumMetrics.metric_add_to_card,{'title':ctx.state.item.title});
        }

        //
        // User metrics
        let user=ctx.user||this.$user.currentUser
        if(user&&user.id){
          this.isAdmin=user.isAdmin();
          return this.identitySet(user.email.address);
        }

        //
        // GET LOGOUT FEEDBACK
        //this.identityClear();
      });
    })).subscribe();
    
  }

  identitySet(uid){
    if(!this.isEnable() || !this.getHost('_kmq')){
      return;
    }
    this.getHost('_kmq').push(['identify', uid])
  }
  
  identityClear(){
    if(!this.isEnable() || !this.getHost('_kmq')){
      return;
    }
    this.getHost('_kmq').push(['clearIdentity']);
  }

  isEnable(){
    return window.location.origin.indexOf('karibou.ch')!=-1&&!this.isAdmin;
  }

  getHost(name:string):any{
    return ((<any>window)._kmq);    
  }

  error(){
    //window.ga('send', 'event', 'error', response.data);
    //window.ga('set', '&uid', user.id)
  }
  page(){
    // $window.ga('send', 'pageview', { page: path });
    // if(fbq)fbq('track', "PageView");
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
    if(!this.isEnable() || !this.getHost('_kmq')){
      return;
    }
    // $window.ga('send', 'event', o.category, o.action);        
    let params={};

    // item:name
    // amount: CHF
    // plan: pro,normal,guest,vendor

    if(options){
      Object.assign(params,options);
    }
    this.getHost('_kmq').push(['record', EnumMetrics[metric], params]);
  }
}

