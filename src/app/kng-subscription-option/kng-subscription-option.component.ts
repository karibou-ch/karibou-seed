import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CartItem, CartService, LoaderService } from 'kng2-core';
import { i18n } from '../common';


export interface SubscriptionFrequency {
  interval:'day' | 'month' | 'week' | 'year';
  dayOfWeek:2|3|4|5;
}

@Component({
  selector: 'kng-subscription-option',
  templateUrl: './kng-subscription-option.component.html',
  styleUrls: ['./kng-subscription-option.component.scss']
})
export class KngSubscriptionOptionComponent implements OnInit {

  private _iteration;
  private _dayOfWeek;

  @Input() quiet = false;

  iterations=["Semaine","Mois"]
  dayOfWeek=["Mardi","Mercredi","Vendredi"]
  items:CartItem[];

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $loader: LoaderService,
    private $cdr: ChangeDetectorRef
  ) { 
    this.items = [];
  }


  get selectedIteration() {
    return this._iteration || 0;
  }

  get selectedIterationLabel() {
    return this.iterations[this._iteration||0];
  }


  get selectedDayOfWeek() {
    return this._dayOfWeek || 0;
  }

  get selectedDayOfWeekLabel() {
    return this.dayOfWeek[this._dayOfWeek||0];
  }


  set selectedIteration(idx) {
    this._iteration = idx;
  }

  set selectedDayOfWeek(idx) {
    this._dayOfWeek = idx;
  }

  get label() {
    return this.$i18n.label();
  }

  get locale() {
    return this.$i18n.locale;
  }


  ngOnInit(): void {

    this.$loader.update().subscribe(emit => {

      // ITEM_ADD       = 1,
      // ITEM_REMOVE    = 2,
      // ITEM_MAX       = 3,
      // CART_INIT      = 4,
      // CART_LOADED    = 5,
      // CART_LOAD_ERROR= 6,
      // CART_SAVE_ERROR= 7,
      // CART_ADDRESS   = 8,
      // CART_PAYMENT   = 9,
      // CART_SHPPING   =10,
      if(emit.state) {
        //this.currentShippingDay = this.$cart.getCurrentShippingDay();
        this.items = this.$cart.getItems().filter(item => item);
        this.$cdr.markForCheck();

      }
      if(!emit.config) {
        return;
      }
    });
  }

}
