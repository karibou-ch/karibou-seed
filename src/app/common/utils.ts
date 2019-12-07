import { UserAddress, Utils } from 'kng2-core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


export class KngUtils {
  static STATIC_MAP = 'https://maps.googleapis.com/maps/api/staticmap?';

  //
  // TODO share staticmap generator
  // https://developers.google.com/maps/documentation/static-maps/intro?hl=fr
  static getStaticMap(address: UserAddress, key: string, size?: string) {
    // TODO use this.config.shared.keys.pubMap
    if (!address || !address.geo) {
      return 'https://image.flaticon.com/icons/svg/235/235861.svg';
    }
    //
    // default value for name
    const name = (address.name) ? address.name : '-';
    const params = {
      key: key,
      center: address.geo.lat + ',' + address.geo.lng,
      maptype: 'roadmap',
      zoom: '14',
      scale: '2',
      size: (size || '200x200'),
      markers: 'color:0x5fea89|label:' + name[0].toUpperCase() + '|' + address.geo.lat + ',' + address.geo.lng
    };
    return KngUtils.STATIC_MAP + Utils.encodeQuery(params);
  }

  static getGeoCode(http, street: string, postal: string, region: string, key: string): Observable<any> {
    // check if needed encodeURIComponent(str)
    postal = postal || '';
    region = region || 'Suisse';
    const fulladdress = [street, postal, region].join(',');
    const url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + fulladdress + '&sensor=false&key=' + key;
    return http.get(url, { withCredentials: false }).pipe(
      map((geo: any) => {
        const result: any = {};
        if (!geo || !geo.results.length || !geo.results[0].geometry) {
          return result;
        }

        result.geo = geo.results[0].geometry;
        result.components = (geo.results[0].address_components || []).map(comp => comp.long_name);
        return result;
      })
    );
  }

  //
  // example with Maps
  // script='<script src="https://maps.googleapis.com/maps/api/js?v=3.exp&key=YOURS"></script>';
  static lazyload(script: string) {
    const fragment = document.createRange().createContextualFragment(script);
    document.body.appendChild(fragment);
  }


  static screen() {
    if (window && window.matchMedia) {
      return window.matchMedia('(max-width: 759px)').matches;
    } else {
      // likely IE 9
      return false;
    }
  }

}


