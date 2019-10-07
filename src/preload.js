//
// links:
// - https://github.com/angular/angular-cli/issues/5306 (transpile correctly for ES5)
// - https://medium.com/@aldoroman/no-more-es5-only-angular-apps-on-prod-b56422de324e
//

//
// manage browser version
var golbalVersion = (function(){
  var ua= navigator.userAgent, tem, 
  M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if(/trident/i.test(M[1])){
      tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE '+(tem[1] || '');
  }
  if(M[1]=== 'Chrome'){
      tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
      if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
  if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
  M[0]=M[0].toLowerCase();
  return M;
})();



//
// browser upgrade
// safari <9
// firefox<55
// chrome<49 (Samsung S4/S5 [Safari4 ou Chrome1], Samsung S6 [Safari4,] )
// edge<15
(function(){

  var block=document.getElementById('must-upgrade');
  var version=document.getElementById('version-upgrade');
  var shouldUpgrade={
    "safari":9,
    "firefox":50,  
    "chrome":49,  
    "edge":15,  
    "ie":12,  
  };
  var downloadLink={
    "safari":"https://www.google.com/intl/fr/chrome/",
    "firefox":"https://www.mozilla.org/fr/firefox/new/",
    "chrome":"https://www.google.com/intl/fr/chrome/",
    "edge":"https://www.google.com/intl/fr/chrome/",
    "ie":"https://www.google.com/intl/fr/chrome/"
  }

  // 
  // please upgrade
//   if(golbalVersion[1]<shouldUpgrade[golbalVersion[0]]){
//     block.style.display='block';
//     version.innerHTML=golbalVersion.join(' ');
//     setTimeout(function(){
//       window['_kmq']&&window['_kmq'].push(['record', 'metric_error_browser', {
//         browser:golbalVersion[0],
//         version:golbalVersion[1]
//       }]);  
//     },1500);
//   }
// })();

if(window.location.origin.indexOf('karibou.ch')>-1){
  //
  // GA
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * (new Date()); a = s.createElement(o),
      m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
  })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

  //
  // FB
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ?
      n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }; if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
  })(window,
    document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');    
}

//
// load metrics
// (function(){
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
// })();


//
// 
// var globalError = function(msg, url, line){
//   if(window.apploaded){
//     return;
//   }
//   console.log("version ",golbalVersion)
//   console.log("Caught[via window.onerror]: '" + msg + "' from " + url + ":" + line);
// };

// window.onerror = globalError;
// window.addEventListener('error', globalError);

