import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Order, OrderCustomerInvoices, OrderService } from 'kng2-core';
import { i18n } from 'src/app/common';



@Component({
  selector: 'kng-invoice',
  templateUrl: './kng-invoice.component.html',
  styleUrls: ['./kng-invoice.component.scss']
})
export class KngInvoiceComponent implements OnInit {

  @Input() invoice: OrderCustomerInvoices;
  @Input() order:Order;
  @Output() closed: EventEmitter<string> = new EventEmitter<string>();

  i18n: any = {
    fr: {
      download_invoice: 'Télécharger la facture',
      month_details: 'Détails du mois',
      subscriptions: 'Commandes d’abonnement',
      ponctuals: 'Commandes ponctuelles',
      invoices: 'Factures ouvertes',
      transfers: 'Virements en attente',
      paids: 'Commandes payées',
      total_invoice: 'Total à facturer',
      refund: 'Remboursement appliqué',
      credit_note: 'Note de crédit appliquée',
      close: 'Fermer'
    },
    en:{
      download_invoice: 'Download invoice',
      month_details: 'Monthly details',
      subscriptions: 'Subscription orders',
      ponctuals: 'One-off orders',
      invoices: 'Open invoices',
      transfers: 'Pending bank transfers',
      paids: 'Paid orders',
      total_invoice: 'Total to invoice',
      refund: 'Refund applied',
      credit_note: 'Credit note applied',
      close: 'Close'
    }
  };

  invoicesAmount:number = 0;
  transfersAmount:number = 0;
  paidsAmount:number = 0;
  qrbillAmount = 0;
  subscriptionOrders:any[] = [];
  ponctualOrders:any[] = [];

  constructor(
    private $i18n: i18n,
    private $order: OrderService,
  ) {
  }


  get locale() {
    return this.$i18n.locale;
  }

  ngOnInit(){
    document.body.classList.add('mdc-dialog-scroll-lock');
    this.prepareInvoice();
  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  prepareInvoice() {
    const invoices = this.invoice.invoices || [];
    const transfers = this.invoice.transfers || [];
    const paids = this.invoice.paids || [];
    const totals = this.invoice.totals;

    this.invoicesAmount = totals.invoicesAmount;
    this.transfersAmount = totals.transfersAmount;
    this.paidsAmount = totals.paidsAmount;
    this.qrbillAmount = totals.qrbillAmount;

    const monthOrders = [...invoices, ...transfers, ...paids];
    this.subscriptionOrders = monthOrders.filter(order => this.isSubscriptionOrder(order));
    this.ponctualOrders = monthOrders.filter(order => !this.isSubscriptionOrder(order));
    document.title = 'k-ch-invoices-' + this.invoice.year + '-' + this.invoice.month;

  }

  isSubscriptionOrder(order:any) {
    return !!(order.subscription || order.payment && order.payment.subscription);
  }

  orderLabel(order:any) {
    const billNote = order.customer && order.customer.billNote;
    return billNote ? order.oid + ' / ' + billNote : order.oid;
  }

  orderNotes(order:any) {
    const notes = [];
    const billNote = order.customer && order.customer.billNote;
    const refund = order.refund || {};
    const creditNote = order.payment && Number(order.payment.credit_note || 0);

    if(billNote) {
      notes.push(billNote);
    }
    if(refund.hasRefund) {
      notes.push(this.i18n[this.locale].refund + (refund.amount ? ': CHF ' + refund.amount.toFixed(2) : ''));
    }
    if(creditNote > 0) {
      notes.push(this.i18n[this.locale].credit_note + ': CHF ' + creditNote.toFixed(2));
    }

    return notes;
  }

  statusLabel(order:any) {
    if(this.invoice.invoices.indexOf(order) > -1) {
      return this.i18n[this.locale].invoices;
    }
    if(this.invoice.transfers.indexOf(order) > -1) {
      return this.i18n[this.locale].transfers;
    }
    return this.i18n[this.locale].paids;
  }

  onDownloadPDF(){
    this.$order.customerInvoicePdf(this.invoice.year, this.invoice.month).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const month = ('0' + this.invoice.month).slice(-2);
      link.href = url;
      link.download = 'karibou-invoice-' + this.invoice.year + '-' + month + '.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    },(status)=> {
      alert(status.error||status.message);
    });
  }
  onClose() {
    this.closed.emit("close");
  }
}
