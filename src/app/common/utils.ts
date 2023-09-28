import { UserAddress, Utils, Config, config } from 'kng2-core';
import { Observable, ReplaySubject } from 'rxjs';
import { map, debounceTime, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml'})
export class KngSafeHtmlPipe implements PipeTransform  {
  constructor(private sanitized: DomSanitizer) {}
  transform(value) {
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}


@Injectable()
export class KngUtils {
  static STATIC_MAP = '/v1/staticmap?';

  private _result$: Observable<any>;
  private _geo$: ReplaySubject<any>;

  constructor(
    private $http: HttpClient
  ) {
    this._geo$ = new ReplaySubject<any>(1);
    this._result$ = this._geo$.pipe(
      // Limit multiple consumer call for google API
      debounceTime(1000),
      switchMap((address:any) => {
        const postal = address.postalCode || '';
        const region = address.region || 'Suisse';
        const street = address.streetAdress;
        const fulladdress = [street, postal, region].join(',');
        const url = config.API_SERVER + '/v1/geocode?address=' + fulladdress + '&sensor=false';
        return this.$http.get(url, { withCredentials: false }).pipe(
          map((geo: any) => {
            //
            // return error message
            if (geo.error_message){
              throw(geo.error_message);
            }
            const result: any = { address: address};
            if (!geo || !geo.results.length || !geo.results[0].geometry) {
              return result;
            }
            result.geo = geo.results[0].geometry;
            result.components = (geo.results[0].address_components || []).map(comp => comp.long_name);
            return result;
          })
        );
      })
    );
  }

  // simple hash function with SDBM algo
  static hacha (str:string) {
    const hash = Array.from(str).reduce((hash, char) => {
      return (hash << BigInt(6)) + BigInt(char.charCodeAt(0)) + (hash << BigInt(16)) - hash ;
    }, BigInt(0));
    // return 8 bytes!
    return (hash & BigInt("0xffffffffffffffff")).toString(16).padStart(16, '0') ;      
  }
  


  //
  // TODO share staticmap generator
  // https://developers.google.com/maps/documentation/static-maps/intro?hl=fr
  static getStaticMap(address: UserAddress, size?: string) {
    // TODO use this.config.shared.keys.pubMap
    if (!address || !address.geo) {
      return 'https://image.flaticon.com/icons/svg/235/235861.svg';
    }
    //
    // default value for name
    const name = (address.name) ? address.name : '-';
    const params = {
      lat: address.geo.lat,
      lng:address.geo.lng,
      name,
      zoom: '14',
      scale: '2',
      size: (size || '400x200')
    };
    return config.API_SERVER + KngUtils.STATIC_MAP + Utils.encodeQuery(params);
  }

  //
  // FIXME add Quota for google API
  // --> https://console.cloud.google.com/google/maps-apis/apis/geocoding-backend.googleapis.com/quotas?project=karibou-api
  updateGeoCode(street: string, postal: string, region: string): Observable<any> {
    const address: any = {
      streetAdress: street,
      region: region,
      postalCode: postal
    };
    this._geo$.next(address);
    //return this._geo$.asObservable();
    return this._result$;
  }


  getGeoCode() {
    return this._result$;
  }

  trackError(msg: string) {
    const Sentry = window['Sentry'];
    if (!Sentry) {
      return;
    }

    if (!Sentry ||
        window.location.origin.indexOf('karibou.ch') === -1) {
        return;
    }

    //
    // publish sentry event only on production
    Sentry.captureException(new Error(msg));
  }
}


