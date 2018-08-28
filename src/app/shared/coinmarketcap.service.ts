import { Injectable } from '@angular/core';

import { TimerObservable } from "rxjs/observable/TimerObservable";
import { ReplaySubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export class Coinmarketcap{
  id:string;
  name:string;
  symbol:string;
  rank:number;
  price_usd:number;
  price_btc:number;
  market_cap_usd:number;
  available_supply:number;
  total_supply:number;
  max_supply:number;
  percent_change_1h:number;
  percent_change_24h:number;
  percent_change_7d:number;
  last_updated:number;
  price_chf:number;
  market_cap_chf:number;
}

@Injectable()
export class CoinmarketcapService {
  public ticker$: ReplaySubject<Coinmarketcap[]>;

  constructor(
    private http: HttpClient
  ) {
    //
    // 1 means to keep the last value
    this.ticker$ = new ReplaySubject(1);

    TimerObservable.create(0, 15000)
      .subscribe(() => {    
            this.http.get('https://api.coinmarketcap.com/v1/ticker/?convert=CHF').subscribe((ticker:Coinmarketcap[]) => {
              this.ticker$.next(ticker as Coinmarketcap[]);
            });

      });
  }

  stop(){

  }
  replay(){

  }



}
