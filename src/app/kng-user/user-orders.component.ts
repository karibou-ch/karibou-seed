import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { LoaderService, Order, OrderService, User, UserService } from 'kng2-core';

@Component({
  selector: 'kng-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private $order: OrderService,
    private $user: UserService
  ) { }

  isReady: boolean = false;
  currentUser: User;
  config: any;
  orders: Order[];

  ngOnInit() {
    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];
      this.$order.findOrdersByUser(this.currentUser).subscribe(res => this.onDone(res), this.onError);
      //this.$order.findOrdersByUser(this.currentUser).subscribe(orders => this.orders=orders);
    })

  }

  onDone(orders: Order[]){
    this.orders=orders;
    console.log(this.orders);
    //
    // TODO: implement feedback message and use const to be ready for i18n
    // this.$flash.message(MSG_DONE,4000);
  }

  onError(error: any){
    console.log(error)
  }

}
