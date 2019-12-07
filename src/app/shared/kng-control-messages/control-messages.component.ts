import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { KngInputValidator } from '../kng-input-validator';
import { i18n } from '../../common/i18n.service';

@Component({
  selector: 'kng-control-messages',
  template: `<div *ngIf="errorMessage !== null">{{errorMessage}}</div>`,
  encapsulation: ViewEncapsulation.None
})
export class KngControlMessagesComponent {

  @Input() control: FormControl;
  constructor(
    private $i18n: i18n
  ) {

  }

  get errorMessage() {
    for (const propertyName in this.control.errors) {
      if (this.control.errors.hasOwnProperty(propertyName) && this.control.touched) {
        return KngInputValidator.getValidatorErrorMessage(this.$i18n, propertyName, this.control.errors[propertyName]);
      }
    }

    return null;
  }

}
