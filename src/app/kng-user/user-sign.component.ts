import { Component, OnInit } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'kng-user-sign',
  templateUrl: './user-sign.component.html',
  styleUrls: ['./user-sign.component.scss']
})
export class UserSignComponent implements OnInit {

  hide = true;
  email = new FormControl('', [Validators.required, Validators.email]);

  constructor() { }

  ngOnInit() {
  }


  getErrorMessage() {
    return this.email.hasError('required') ? 'You must enter a value' :
        this.email.hasError('email') ? 'Not a valid email' :
            '';
  }
  

}
