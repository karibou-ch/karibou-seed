import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Order, OrderCustomerInvoices, OrderItem, OrderService } from 'kng2-core';
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
  @ViewChild('qrbill') svg: ElementRef;


  headerImg = '/assets/img/k-puce-v.png';
  creditor = {
    name: "Karibou.ch SA",
    address: "5 ch. du 23-Aout",
    zip: 1205,
    city: "Geneve",
    account: "CH03 0839 0039 3567 1010 0",
    country: "CH"
  };

  //
  // Lazy load SVG module
  contentSVG="";
  module:any;

  shipping:{
    name:string;
    address: string;
    postalCode: string;
  }
  today:Date;

  i18n: any = {
    fr: {
      title_payment_done: 'Valider exclusivement après le virement bancaire!',
    },
    en:{
      title_payment_done: 'Validate only after bank transfer',
    }
  };

  invoicesAmount:number = 0;
  transfersAmount:number = 0;
  paidsAmount:number = 0;

  printQr = false;

  constructor(
    private $i18n: i18n,
    private $order: OrderService,
  ) {
  }


  get locale() {
    return this.$i18n.locale;
  }

  ngOnInit(){
    this.today = new Date();
    document.body.classList.add('mdc-dialog-scroll-lock');
    document.documentElement.classList.add('mdc-dialog-scroll-lock');
    this.prepareInvoice();
  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
    document.documentElement.classList.remove('mdc-dialog-scroll-lock');
  }

  async prepareInvoice() {
    const invoices = this.invoice.invoices;
    this.shipping = {
      name: this.order.shipping.name,
      address: this.order.shipping.streetAdress,
      postalCode: this.order.shipping.postalCode,      
    }

    //
    // invoices
    invoices.forEach((order:any) => {
      order.amount = this.getTotalPrice(order);
    });
    this.invoicesAmount = invoices.reduce((sum,order:any)=>{
      const amount = order.amount;      
      return sum+amount;
    },0);

    //
    // paids
    this.invoice.paids.forEach((order:any) => {
      order.amount = this.getTotalPrice(order);
    });
    this.paidsAmount = this.invoice.paids.reduce((sum,order:any)=>{
      const amount = order.amount;
      return sum+amount;
    },0);

    //
    // transfers
    this.invoice.transfers.forEach((order:any) => {
      order.amount = this.getTotalPrice(order);
    });

    this.transfersAmount = this.invoice.transfers.reduce((sum,order:any)=>{
      const amount = order.amount;      
      return sum+amount;
    },0);

    //
    // do not create SVG QR bill 
    if(!invoices.length) {
      this.printQr = true;
      return;
    }


    const ordersTxt = 'K-ch-QRBILL: '+invoices.map(order => order.oid).join('-');
    
    this.contentSVG = {
      currency: "CHF",
      amount: this.invoicesAmount,
      message: ordersTxt,
      creditor: {...this.creditor},
      debtor: {
        name: this.order.shipping.name,
        address: this.order.shipping.streetAdress,
        zip: this.order.shipping.postalCode,
        city: this.order.shipping.region,
        country: "CH"
      }
    } as any;    

    //
    // load qr generator if needed
    if(!this.module) {
      this.module = await import('swissqrbill/lib/node/esm/node/svg.js');
    }
    console.log('--create invoice QR',this.svg )

    if (this.svg && this.svg.nativeElement && this.module && this.module.SVG) {     
      this.svg.nativeElement.innerHTML = new this.module.SVG(this.contentSVG, { language: 'EN' });
    }          

    this.printQr = true;
  }

  roundCHF(value) {
    return parseFloat((Math.round(value*20)/20).toFixed(2))
  }
  

  getTotalPrice(order){

    const total = order.items.reduce((sum, item)=>{
      //
      // item should not be failure (fulfillment)
      if(item.fulfillment.status!=='failure'){
        return sum+=item.finalprice*(1+order.fees.charge);
      }
      return sum;
    },0);
  
    return this.roundCHF(total + order.fees.shipping);
  }

  onPrint(){
    window.print();
  }

  onUpdateInvoices(){
    const oids = this.invoice.invoices.map(order => order.oid);
    this.$order.updateInvoices(oids, this.invoicesAmount).subscribe((result)=>{
      alert("Merci d'avoir effectué le paiement :-)")
    })
  }
  onClose() {
    this.closed.emit("close");
  }
}
