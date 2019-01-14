import { Component, EventEmitter ,Input, Output } from '@angular/core';

import { LoaderService, 
         User, 
         UserAddress, 
         UserService, 
         Config,
         Utils} from 'kng2-core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { KngUtils } from '../common';
import { HttpClient } from '@angular/common/http';


export interface AddressEvent{
  address?:UserAddress;
  error?:Error|any;
}


@Component({
  selector: 'kng-user-address',
  templateUrl: './user-address.component.html',
  styleUrls: ['./user-address.component.scss']
})
export class AddressComponent {

  defaultUser:User=new User();

  @Output() updated:EventEmitter<AddressEvent>=new EventEmitter<AddressEvent>();

  @Input() small:boolean;
  @Input() user:User;
  @Input() address: UserAddress;
  @Input() action:boolean;
  @Input() set config(config:Config){
    this.main(config);
  }

  addresses=[
    "Chemin du 23-Août, 4",
    "Chemin du 23-Août, 5",
    "Chemin du 23-Août, 6",
    "Chemin du 23-Août, 7",
    "Chemin du 23-Août, 8",
    "Chemin du 23-Août, 9",
    "Chemin du 23-Août, 10",
    "Chemin du 23-Août, 11",
    "Chemin du 23-Août, 12",
    "Chemin du 23-Août, 13",
    "Chemin du 23-Août, 14",
    "Chemin du 23-Août, 16",
    "Chemin du 23-Août, 17",
    "Chemin du 23-Août, 18"
  ];
  $address:FormGroup;
  locations:string[];
  regions:string[];
  pubkeyMap:string;
  idx:number;
  geo:any;
  isLoading:boolean;
  
  // utiliser l'api 
  // https://tel.search.ch/api/help.fr.html
  constructor(
    private $fb: FormBuilder,
    private $http:HttpClient,
    private $user:UserService
  ){
    this.isLoading=false;
    this.$address = this.$fb.group({
      'name':   ['', [Validators.required,Validators.minLength(3)]],
      'note':   [''],
      'floor':  ['', [Validators.required,Validators.minLength(1)]],
      'street': ['', [Validators.required,Validators.minLength(5)]],
      'region': ['', [Validators.required]],
      'postalCode': ['', [Validators.required,Validators.minLength(4)]],
      'phone':  ['', [Validators.required,Validators.minLength(10)]]      
    });
    //[ngModelOptions]="{updateOn: 'blur'}"
  }


  //
  // entry poiont
  main(config:Config){
    this.locations=config.shared.user.location.list;
    this.regions=config.shared.user.region.list;
    this.pubkeyMap=config.shared.keys.pubMap||'';

    
    //
    // save phone
    if(this.user.phoneNumbers.length){
      this.$address.patchValue({
        phone:this.user.phoneNumbers[0].number
      });
    }

    // console.log('--- load map',config.shared.keys.pubMap)
    // FIXME this line for universal app
    if(!window['google']&&config.shared.keys.pubMap){
      this.loadMap(config).subscribe(()=>{
        //DONE!
      });
    }
    
  }

  // validPassword(control: AbstractControl) {
  //   return observableOf('12345678910' === control.value).pipe(
  //     map(result => result ? { invalid: true } : null)
  //   );
  // }  

  getUser(){
    return this.user||this.defaultUser;
  }
  
  getStaticMap(address:UserAddress){
    return KngUtils.getStaticMap(address,this.pubkeyMap);    
  }


  isSelectedAddress(address:UserAddress,idx:number){
    return this.idx==idx;
  }

  loadMap(config:Config){
    return Utils.script('https://maps.googleapis.com/maps/api/js?libraries=places&key='+config.shared.keys.pubMap,'maps');
  }
  
  onEmit(result:AddressEvent){
    this.isLoading=false;
    this.updated.emit(result);
  }


  onGeloc(event?: { index: number, value: any }){
    if(!this.$address.value.street){
         return;
    }
    KngUtils.getGeoCode(this.$http,this.$address.value.street,this.$address.value.postalCode,this.$address.value.region,this.pubkeyMap).subscribe(
      (result)=>{
        this.geo=(result.geo||{}).location;
        //
        // autofill region and location
        result.components.forEach(comp=>{
          if(this.locations.indexOf(comp)>-1){
            this.$address.patchValue({postalCode:comp});
          }
          if(this.regions.indexOf(comp)>-1){
            this.$address.patchValue({region:comp});
          }
        });        
      }
    )
  }

  onSave(){
    this.isLoading=true;    
    let tosave=new User(this.user);

    //
    // editable phone, max len == 1
    if(tosave.phoneNumbers.length){
      tosave.phoneNumbers[0].number=this.$address.value.phone;
    }
    if(!tosave.phoneNumbers.length){
      tosave.phoneNumbers.push({number:this.$address.value.phone,what:'mobile'});
    }
    
    //
    //edit or create
    if([0,1,2,3,4,5,6].indexOf(this.idx)>-1){      
      tosave.addresses[this.idx].name=this.$address.value.name,
      tosave.addresses[this.idx].streetAdress=this.$address.value.street,
      tosave.addresses[this.idx].floor=this.$address.value.floor,
      tosave.addresses[this.idx].region=this.$address.value.region,
      tosave.addresses[this.idx].postalCode=this.$address.value.postalCode,
      tosave.addresses[this.idx].note=this.$address.value.note
    }else{
      this.idx=tosave.addresses.push(new UserAddress(
        this.$address.value.name,
        this.$address.value.street,
        this.$address.value.floor,
        this.$address.value.region,
        this.$address.value.postalCode,
        this.$address.value.note
      ))-1;
    }

    //
    // update Geo localisation
    if(this.geo){
      tosave.addresses[this.idx].geo=this.geo
    }
    
    this.$user.save(tosave).subscribe(
      user=>this.onEmit({address:tosave.addresses[this.idx]}),
      err=>this.onEmit({error:new Error(err.error)})
    )

  }

  removeAddress(address:UserAddress,idx:number){
    this.isLoading=true;    
    let tosave=new User(this.user);
    if(tosave.addresses[idx].streetAdress==address.streetAdress){
      tosave.addresses.splice(idx,1);
      this.$user.save(tosave).subscribe(
        user=>this.onEmit({address:address}),
        err=>this.onEmit({error:new Error(err.error)})
      );
    }
  }

  setAddress(address:UserAddress,idx:number){
    let defaultAddress={
      name:'',
      street:'',
      floor:'',
      region:address.region,
      postalCode:address.postalCode,
      note:''
    }

    if(this.idx==idx){
      this.idx=null;
      this.$address.patchValue(defaultAddress);
      return; 
    }
    this.idx=idx;
    this.geo=null;
    this.$address.patchValue({
      name:address.name,
      street:address.streetAdress,
      floor:address.floor,
      region:address.region,
      postalCode:address.postalCode,
      note:address.note
    });
  }
  
}


