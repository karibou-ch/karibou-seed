import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { CoinmarketcapService, Coinmarketcap } from '../coinmarketcap.service';

@Component({
  selector: 'visashift-ticker',
  templateUrl: './visashift-ticker.component.html',
  styleUrls: ['./visashift-ticker.component.scss']
})
export class VisashiftTickerComponent implements OnInit, OnDestroy {
  coins = ['USD', 'CHF', 'EUR'];
  alive = true;
  coinsmarkets:Coinmarketcap[]=[];

  constructor(
    private $coinsmarket:CoinmarketcapService
  ) {}

  ngOnInit() {
    this.$coinsmarket.ticker$.subscribe(coinmarketcaps=>{
        this.coinsmarkets=coinmarketcaps;
        
    });
  }

  ngOnDestroy(){
  }
}
