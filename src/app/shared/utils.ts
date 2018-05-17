import { UserAddress, Utils } from "kng2-core";
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

export class KngUtils {
  static STATIC_MAP:string="https://maps.googleapis.com/maps/api/staticmap?";

  //
  // TODO share staticmap generator
  // https://developers.google.com/maps/documentation/static-maps/intro?hl=fr
  static getStaticMap(address:UserAddress){
    // TODO use this.config.shared.keys.pubMap
    if(!address||!address.geo){
      return "https://image.flaticon.com/icons/svg/235/235861.svg";
    }
    //
    // default value for name
    let name=(address.name)?address.name:'-';
    let params={
      key:"AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU",
      center:address.geo.lat+","+address.geo.lng,
      maptype:"roadmap",
      zoom:'14',
      scale:'2',
      size:'200x200',
      markers:'color:0x5fea89|label:'+name[0].toUpperCase()+'|'+address.geo.lat+','+address.geo.lng
    }
    return KngUtils.STATIC_MAP+Utils.encodeQuery(params);
  }
 
  static getGeoCode(http, street:string, postal:string, region:string): Observable<any> {
    // check if needed encodeURIComponent(str)
    let fulladdress=[street,postal,(region||'Suisse')].join(',');
    var url = "//maps.googleapis.com/maps/api/geocode/json?address=" + fulladdress + "&sensor=false";
    return http.get(url, { withCredentials: false }).pipe(
      map((geo:any) =>{ 
        return (!geo.results.length || !geo.results[0].geometry)?{}:geo.results[0].geometry;
      })
    );
  }

  //
  // example with Maps
  // script='<script src="https://maps.googleapis.com/maps/api/js?v=3.exp&key=YOURS"></script>';
  static lazyload(script:string){
    const fragment = document.createRange().createContextualFragment(script);
    document.body.appendChild(fragment);
  }

}


