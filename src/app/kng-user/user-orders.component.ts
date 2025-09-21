import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order, OrderService, User, OrderItem, Category, ProductService,
          EnumCancelReason, CartService, CartItem, EnumFulfillments, PhotoService, Product, LoaderService } from 'kng2-core';
import { MdcSnackbar } from '@angular-mdc/web';

import { switchMap } from 'rxjs/operators';
import { i18n } from '../common';
import { forkJoin } from 'rxjs';

interface ScoredItem {
  score: number;
  item: OrderItem;
}

@Component({
  selector: 'kng-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit {
  isReady = false;
  user: User;
  config: any;
  orders: Order[];
  limitTo: number;
  childOrder: { [key: number]: Order[]};
  openOrder: Order;
  selected: Order;
  items: ScoredItem[] = [];
  photos: any = {};
  categories: Category[];

  filter: any = {};

  i18n: any = {
    fr: {
      title_no_order: 'Vous n\'avez pas encore de commandes',
      title_last_order: 'Mes dernières commandes et feedbacks',
      title_cancel_order: 'Annuler la commande en attente',
      title_add_all_to_cart: 'Tout ajouter dans le panier'
    },
    en: {
      title_no_order: 'You have no orders yet',
      title_last_order: 'My previous orders and feedbacks',
      title_cancel_order: 'Cancel the pending order',
      title_add_all_to_cart: 'Add all to cart'
    }
  };


  constructor(
    private $cart: CartService,
    private $i18n: i18n,
    private $order: OrderService,
    private $products: ProductService,
    private $photos: PhotoService,
    private $snack: MdcSnackbar,
    private $loader: LoaderService
  ) {
    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config, user, categories, orders } = this.$loader.getLatestCoreData();

    this.config = config;
    this.user = user;
    this.categories = categories || [];
    this.orders = orders || [];

    // ✅ INITIALISATION: childOrder pour éviter undefined access
    this.childOrder = {};

    const now = new Date();
    this.filter = {
      all: now.plusDays(-(31 * 1000)),
      month6: now.plusDays(-(31 * 12)),
      mont3: now.plusDays(-(31 * 3)),
    };
    this.limitTo = 10;
    this.filter.current = this.filter.month6;
  }


  //
  // https://stackoverflow.com/questions/49698640/flatmap-mergemap-switchmap-and-concatmap-in-rxjs
  ngOnInit() {
    this.$order.findOrdersByUser(this.user, {limit: 20}).pipe(
      switchMap((orders:Order[]) => {
        this.processOrders(orders);
        if (!this.items.length) {
          return [];
        }
        return this.$photos.products({
          skus: this.items.slice(1, 5).map(rank => rank.item.sku + ''),
          active: true
        });
      })
    ).subscribe(
      items => {
        items.forEach(item => this.photos[item.sku] = item.photo.url);
        this.isReady = true;
      },
      err => this.onError(err.error)
    );

  }

  //
  // WARNING always add to card from an OrderItem (vs CartItem)
  addToCard(item: OrderItem) {
    const variant = (item.variant) ? item.variant.title : null;
    this.$products.get(item.sku).subscribe(product => {
      this.$cart.add(CartItem.fromProduct(product, this.config.shared.hub.slug, variant));
    }, error => this.$snack.open(error.error));
  }

  addAllToCart(order: Order) {
    //
    // FIXME, replace load N products in N calls BY N products in one call
    const hub = this.config.shared.hubs.find( hub => hub.id == order.hub);
    forkJoin(order.items.map(item => this.$products.get(item.sku))).subscribe((products) => {
      const items = products.map((product,i) => {
        const variant = (order.items[i].variant) ? order.items[i].variant.title : null;
        const quantity = order.items[i].quantity || 1;
        return CartItem.fromProduct(product, hub.slug, variant, quantity);
      });
      this.$cart.addAll(items);
    });

  }

  cancel(order: Order) {
    this.$order.cancelWithReason(order, EnumCancelReason.customer).subscribe(result => {
      this.$snack.open(
        this.$i18n.label().delete_ok,
        this.$i18n.label().thanks, this.$i18n.snackOpt
      );
      Object.assign(order, result);
    }, error => this.$snack.open(error.error));
  }

  getLimitedOrders() {
    return this.orders.filter((item, idx) => idx < this.limitTo && !item.shipping.parent );
  }

  getOpenOrder() {
    return this.openOrder;
  }

  getMoreOrders() {
    this.limitTo += 10;
  }

  getItems() {
    if (!this.isReady) {
      return [];
    }
    return this.items.filter((item, idx) => idx < 10 );
  }

  getOrderStatusIcon(order: Order) {
    // "pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"
    switch (order.payment.status) {
      case 'invoice':
      case 'pending':
        return 'more_horiz';
      case 'authorized':
      case 'prepaid':
        return 'radio_button_unchecked';
      case 'paid':
      case 'invoice_paid':
            return 'check_circle';
      case 'partially_refunded':
      case 'manually_refunded':
        return 'check_circle';
      case 'refunded':
        return 'sync_problem';
      case 'voided':
        return 'cancel';
    }
    return 'cancel';
  }

  // /-/resize/128x/
  getThumbnail(item: OrderItem) {
    return this.photos[item.sku] || '/assets/img/icon-finefood.png';
  }

  isPaidOrRefund(order: Order) {
    return ['invoice','invoice_paid','paid', 'manually_refund', 'partially_refunded'].indexOf(order.payment.status) > -1;
  }

  isInvoiceOpen(order: Order) {
    return order.payment.status == 'invoice';
  }

  isPending(order: Order) {
    // console.log('....',order.payment.status,order.fulfillments.status)
    return ['authorized','prepaid'].indexOf(order.payment.status) > -1 && order.fulfillments.status === EnumFulfillments[EnumFulfillments.reserved];
  }

  get locale() {
    return this.$i18n.locale;
  }

  processOrders(orders: Order[]) {
    const scoreditem: {[key: string]: ScoredItem; } = {};
    // this.orders=orders.filter(order=>{
    //   return order.shipping.when>this.filter.current
    // });
    //
    // display 20 last orders
    this.childOrder = {};

    this.orders = orders.sort((o1, o2) => o2.shipping.when.getTime() - o1.shipping.when.getTime());
    this.openOrder = this.orders.find(order =>  ['authorized','prepaid'].indexOf(order.payment.status)>-1);
    this.orders.forEach((order, idx) => {
      this.setChildOrder(order);
      order.items.forEach(item => {
        if (!scoreditem[item.sku]) {
          scoreditem[item.sku] = {
            score: 0,
            item: item
          };
        }
        scoreditem[item.sku].score += item.quantity;
      });

    });
    // this.items=Object.values(scoreditem)
    Object.keys(scoreditem).map(key => scoreditem[key]).sort((a: any, b: any) => {
      return b.score - a.score;
    });

    // console.log('-----------',this.items)

    //
    // TODO: implement feedback message and use const to be ready for i18n
    // this.$flash.message(MSG_DONE,4000);
  }

  onDecline() {
    this.openOrder = null;
  }

  onError(error: any) {
    this.$snack.open(error);
  }

  onFeedback() {
    this.openOrder = null;

  }

  setChildOrder(order) {
    const parentoid = order.shipping.parent;
    this.childOrder[order.oid] = this.childOrder[order.oid] || [];
    if(parentoid) {
      this.childOrder[parentoid] = this.childOrder[parentoid] || [];
      this.childOrder[parentoid].push(order);
    }
  }
  selectedOrder(order) {
    if (this.selected && this.selected.oid === order.oid) {
      return this.selected = undefined;
    }
    this.selected = order;
  }

}
