import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService, User, OrderCustomerInvoices, Order } from 'kng2-core';
import { MdcSnackbar } from '@angular-mdc/web';

import { i18n } from '../common';


@Component({
  selector: 'kng-user-invoices',
  templateUrl: './user-invoices.component.html',
  styleUrls: ['./user-invoices.component.scss']
})
export class UserInvoicesComponent implements OnInit {
  isReady = false;
  user: User;
  config: any;
  order:Order;

  invoices: OrderCustomerInvoices[];

  currentInvoice: OrderCustomerInvoices;


  i18n: any = {
    fr: {
      title_no_order: 'Vous n\'avez pas encore de facture',
      title_last_order: 'Mes dernières commandes et feedbacks',
      title_item: 'article(s)',
      title_paid: 'payée',
      title_transfer: 'facture validée, en attente du virement bancaire',
      title_invoice: 'facture ouverte',
      title_invoive_month: 'Facture du mois',
      title_open_invoive: 'Imprimer la facture'
    },
    en: {
      title_no_order: 'You have no invoice yet',
      title_last_order: 'My previous orders and feedbacks',
      title_item: 'items(s)',
      title_paid: 'paid',
      title_transfer: 'validated invoice, pending bank transfer',
      title_invoive_month: 'Invoice of the month',
      title_invoice: 'bill to pay',
      title_open_invoive: 'Print invoice'
    }
  };


  constructor(
    private $i18n: i18n,
    private $order: OrderService,
    private $route: ActivatedRoute
  ) {
    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    console.log('---',loader)

    //
    // system ready
    this.user   = loader[1];
    this.config = loader[0];
    this.order  = loader[4]?loader[4][0]:null;
    this.invoices = [];
  }


  get locale() {
    return this.$i18n.locale;
  }


  ngOnInit() {
    this.$order.customerInvoices().subscribe(invoices => {
      this.invoices = invoices;
      this.isReady = true;
    });
  }

  onOpenInvoice(invoice) {
    this.currentInvoice = invoice;
  }

}
