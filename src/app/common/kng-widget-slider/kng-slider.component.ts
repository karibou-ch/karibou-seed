import { Component, OnInit, Output, EventEmitter, forwardRef, Input, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'kng-slider',
  templateUrl: './kng-slider.component.html',
  styleUrls: ['./kng-slider.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => KngSliderComponent),
    multi: true
  }]

})
export class KngSliderComponent implements OnInit {
  private _value: string | any;

  @Input() disabled = false;
  @Input() small = false;


  // Function to call when the input changes.
  onChange = (text: string) => {};

  // Function to call when the input is touched (when check is clicked).
  onTouched = (text: string) => {};

  constructor(
  ) {
  }

  ngOnInit() {
  }


  get value() {
    return this._value;
  }

  set value($value) {
    if ($value !== undefined && this._value !== $value) {
      this._value = $value;
    }
  }

  onClick($event) {
    this.value = !this.value
    this.onChange(this.value);
    this.onTouched(this.value);
}
  

  onCheck(event) {
    //this.onChange.emit(event.checked);
    this.value = event.target.checked;
      this.onChange(this.value);
      this.onTouched(this.value);
    }



  writeValue(value: string): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }


}
