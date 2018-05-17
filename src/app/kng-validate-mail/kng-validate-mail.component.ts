import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService, Config } from 'kng2-core';

@Component({
  selector: 'app-kng-validate-mail',
  templateUrl: './kng-validate-mail.component.html',
  styleUrls: ['./kng-validate-mail.component.scss']
})
export class KngValidateMailComponent implements OnInit {

  uid:string;
  email:string;
  validate:any;
  error:any;
  config:Config;

  constructor(
    private $route: ActivatedRoute,    
    private $user:UserService    
  ) { 
    this.uid = this.$route.snapshot.params['uid'];
    this.email = this.$route.snapshot.params['mail'];
    this.config= this.$route.snapshot.data.loader[0];
  }

  //
  // testing
  // http://localhost:4000/validate/ac97700878eb995cbad18f45c6c6f7543770f208/test1@karibou.ch
  ngOnInit() {
    this.$user.validate(this.uid,this.email).subscribe(
      (validate)=>this.onValidate(null,validate),
      (err)=>this.onValidate(err.error)
    )
  }

  onValidate(err,validate?){
    this.error=err;
    this.validate=validate;
  }

}
