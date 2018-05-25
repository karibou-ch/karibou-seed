import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { LoaderService, Order, OrderService, User, UserService, OrderItem, Category, ProductService } from 'kng2-core';
import { MdcSnackbar } from '@angular-mdc/web';

import { mergeMap, flatMap } from 'rxjs/operators';

interface ScoredItem{
  score:number;
  item:OrderItem;
}

@Component({
  selector: 'kng-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit {
  isReady: boolean = false;
  user: User;
  config: any;
  orders: Order[];
  items:ScoredItem[]=[];
  photos:any={};
  categories:Category[];

  filter:any={};

  constructor(
    private $loader: LoaderService,
    private $order: OrderService,
    private $products:ProductService,
    private $route:ActivatedRoute,
    private $user: UserService,
    private $snack:MdcSnackbar
  ) { 
    //
    // initialize loader
    let loader=this.$route.snapshot.data.loader;
    //
    // system ready
    this.user   = loader[1];
    this.config = loader[0];
    this.categories = loader[2];
    let now=new Date();
    
    this.filter={
      all:now.plusDays(-(31*1000)),
      month6:now.plusDays(-(31*12)),
      mont3:now.plusDays(-(31*3)),
    }
    this.filter.current=this.filter.month6;
  }


  ngOnInit() {
    this.$order.findOrdersByUser(this.user).pipe(
      flatMap(orders=>{
        this.processOrders(orders);
        if(!this.items.length){
          return [];
        }
        return this.$products.photos(this.items.map(rank=>rank.item.sku+''));        
      })
    ).subscribe(
      items => {
        items.forEach(item=>this.photos[item.sku]=item.photo.url);
        this.isReady=true;
      }, 
      err=>this.onError(err.error)
    );

  }

  getItems(){
    if(!this.isReady){
      return [];
    }
    return this.items;
  }

  // /-/resize/128x/
  getThumbnail(item:OrderItem){
    return this.photos[item.sku]||'/assets/img/icon-finefood.png';
  }

  processOrders(orders: Order[]){
    let scoreditem:{[key:string]:ScoredItem;}={};
    // this.orders=orders.filter(order=>{
    //   return order.shipping.when>this.filter.current
    // });
    //
    // display 20 last orders
    this.orders=orders.sort((o1,o2)=>o2.shipping.when.getTime()-o1.shipping.when.getTime()).splice(0,10);
    this.orders.forEach(order=>{
      order.items.forEach(item=>{
        if(!scoreditem[item.sku]){
          scoreditem[item.sku]={
            score:0,
            item:item
          }
        }
        scoreditem[item.sku].score++;
      })
    });

    this.items=Object.values(scoreditem).sort((a:any,b:any)=>{
      return b.score-a.score;
    });

    //console.log('-----------',this.items)

    //
    // TODO: implement feedback message and use const to be ready for i18n
    // this.$flash.message(MSG_DONE,4000);
  }

  onError(error: any){
    this.$snack.show(error);
  }

  onSelect($event,rank:ScoredItem){

  }

}
