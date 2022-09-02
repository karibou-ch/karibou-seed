import { AbstractControl } from '@angular/forms';
import { i18n } from '../common/i18n.service';

/**
 *
 */
export class KngInputValidator {

  static getValidatorErrorMessage($i18n: i18n, validatorName: string, validatorValue?: any) {
    //
    // TODO/FIXME use runtime $i18n translation service  here
    const config = {
      'required': 'Required',
      'invalidCreditCard': 'Is invalid credit card number',
      'invalidEmailAddress': 'Invalid email address',
      'invalidPassword': 'Password must be at least 6 characters',
      'MatchPassword': 'Password dont match',
      'minlength': `Minimum length ${validatorValue.requiredLength}`
    };

    return config[validatorName];
  }

  static creditCardValidator(control) {
    //
    // Visa, MasterCard, American Express, Diners Club, Discover, JCB
    if (control.value.match(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/)) {
      return null;
    } else {
      return { 'invalidCreditCard': true };
    }
  }

  static emailValidator(control) {
    // RFC 2822 compliant regex
    if (control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
      return null;
    } else {
      return { 'invalidEmailAddress': true };
    }
  }

  static passwordValidator(control) {
    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    if (control.value.match(/^(?=.*[a-z0-9])[a-zA-Z0-9!@#.;,\-\+_$%^&*{}()\[\]éàèüöä="'\?]{6,100}$/)) {
      return null;
    } else {
      return { 'invalidPassword': true };
    }
  }

  static MatchPasswordAndConfirm(AC: AbstractControl) {
    const password = AC.get('password').value;
    const confirm = AC.get('confirm').value;
     if (password !== confirm) {
         AC.get('confirm').setErrors( {MatchPassword: true} );
     } else {
         return null;
     }
 }
}
