import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { InputValidator } from '../input-validator';

@Component({
  selector: 'kng-control-messages',
  template: `<div *ngIf="errorMessage !== null">{{errorMessage}}</div>`,  
  encapsulation: ViewEncapsulation.None
})
export class ControlMessagesComponent {

  @Input() control: FormControl;
  constructor() { }

  get errorMessage() {
    for (let propertyName in this.control.errors) {
      if (this.control.errors.hasOwnProperty(propertyName) && this.control.touched) {
        return InputValidator.getValidatorErrorMessage(propertyName, this.control.errors[propertyName]);
      }
    }

    return null;
  }

}
