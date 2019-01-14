import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Utils } from 'kng2-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  RAVEN_JS="https://cdnjs.cloudflare.com/ajax/libs/raven.js/3.26.2/angular,console,require/raven.min.js";
  SENTRY_JS="https://browser.sentry-cdn.com/4.4.2/bundle.min.js";

  constructor(
    // private swUpdate:SwUpdate
  ){

    //
    // install error backend 
    Utils.script(this.SENTRY_JS,'Sentry').subscribe((Sentry:any)=>{
      Sentry.init({
        dsn: 'https://9457c6b1c4e343b8b1aa7e74642147e0@sentry.io/1360987',
        release:'v2'    
      });      
    })
    

    // if(this.swUpdate.isEnabled){
    //   this.swUpdate.available.subscribe(next=>{
    //     if(confirm("Une nouvelle version est disponible. Recharger la page?")){
    //       window.location.reload();
    //     }
    //   });
    // }
  }
}
