import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common'

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
  @ViewChild('pdfHeader') pdfHeader: ElementRef;
  @ViewChild('pdfCustomer') pdfCustomer: ElementRef;
  @ViewChild('pdfCustomer') pdfContent: ElementRef;


  headerImg = '/assets/img/k-puce-v.png';
  headerImgB64 ='';

  //
  //
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
  contentSVG:any={};
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
  qrbillOrders = [];
  qrbillAmount = 0;

  printQr = false;

  constructor(
    private $i18n: i18n,
    private $order: OrderService,
  ) {
  }


  get locale() {
    return this.$i18n.locale;
  }


  async convertImageToBase64(imgUrl):Promise<string> {
    const image = new Image();
    image.crossOrigin='anonymous';
    image.src = imgUrl;
    return new Promise((resolve)=> {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = image.naturalHeight;
        canvas.width = image.naturalWidth;
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL());
      }
    });
  }

  ngOnInit(){
    this.today = new Date();
    document.body.classList.add('mdc-dialog-scroll-lock');
    this.convertImageToBase64(this.headerImg).then(b64=>this.headerImgB64 = b64);
    this.prepareInvoice();
    import('swissqrbill/lib/node/esm/node/svg.js').then(module => {
      this.module = module;
      if(!this.qrbillAmount){
        return
      }
      if(!this.svg ||
         !this.contentSVG ||
         !this.module ||
         !this.module.SVG){
          return;
         }

      this.svg.nativeElement.innerHTML = new this.module.SVG(this.contentSVG, { language: 'EN' });
      this.printQr = true;
    })

  }

  ngOnDestroy() {
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  prepareInvoice() {
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
    // create SVG QR bill for Orders in status Invoice OR Transfer
    this.qrbillOrders = invoices.length? invoices:this.invoice.transfers;
    if(!this.qrbillOrders.length) {
      this.printQr = true;
      return;
    }

    this.qrbillAmount = invoices.length?this.invoicesAmount:this.transfersAmount
    const ordersTxt = 'K-ch: '+this.qrbillOrders.map(order => order.oid).join('-');

    this.contentSVG = {
      currency: "CHF",
      amount: this.qrbillAmount,
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
    // setup the title
    const when = new Date(this.qrbillOrders[0].when);
    const format = (when.getFullYear())+' - '+(when.getMonth()+1);
    const who = this.order.customer.email.replace(/[.@]/,'-');
    document.title = 'k-ch-invoices'+format+' - '+who+' - '+this.qrbillOrders.map(order => order.oid).join('-');
    //console.log('--create invoice QR',this.svg )

  }

  round1cts(value) {
    return parseFloat((Math.round(value*100)/100).toFixed(2))
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

    return this.round1cts(total + order.fees.shipping);
  }

  //
  // lazy download off pdf toolkit as it's super lourd
  async onDownloadPDF(){
    const $date = new DatePipe('fr-ch');
    const modulea = await import("pdfmake/build/pdfmake");
    const moduleb = await import("pdfmake/build/vfs_fonts");
    const pdfMake = modulea.default;
    const pdfFonts = moduleb.default;
    (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;


    const pageWidth = 595.28;
    const pageHeigth= 841.89;
    const svgStr = this.svg.nativeElement.innerHTML.replace('<svg ','<svg viewBox="0 0 650 280" ');
    const docDefinition = {
      pageSize: {
        width: pageWidth,
        height: pageHeigth
      },
      content: [

        //
        // HEADER
        {
          text: 'Karibou.ch SA - facture du '+$date.transform(new Date(), "d MMM y"),
          fontSize: 16,
          alignment: 'left'
        },
        {
          text: document.title+'',
          alignment: 'left',
          fontSize:10,
        },
        //
        // Customer details
        {
          columns: [
            [
              {
                text: '-',
                alignment: 'left',
                width:'*'
              }
            ],
            [
              {
                text: this.contentSVG.debtor.name,
                bold: true,
                width:'30%'
              },
              { text: this.contentSVG.debtor.address, width:'30%' },
              { text: this.contentSVG.debtor.zip, width:'30%' },
              { text: this.order.customer.email, width:'30%' }
            ],
          ],
          columnGap: 0,
          margin: [0,20]

        },
        //
        // Invoice Details
        {
          text: 'Details de la facture',
          style: 'sectionHeader'
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              ['Quantité', 'Commande', 'Date', 'CHF'],
              ...this.qrbillOrders.map(p => (['1x', p.oid, $date.transform(p.when, "d MMM y"), {text:parseFloat(p.amount.toFixed(2)),bold:true}])),
              [{ text: 'Total', colSpan: 3 }, {}, {}, {text:parseFloat(this.qrbillAmount.toFixed(2)),bold:true}]
            ]
          },
          margin: [0,20]
        },
        //
        // INVOICE QR
        { svg: svgStr, fit: [450, 400],margin:0},
        //
        // SINGATURE
        {
          text: 'Avec nos meilleures salutations,\nkaribou.ch SA',
          margin: [0,20]
        }

      ],
      styles: {
        sectionHeader: {
          bold: true,
          decoration: 'underline',
          fontSize: 14,
          margin: [0, 15, 0, 15]
        }
      }
    }
    pdfMake.createPdf(docDefinition).download(document.title);
  }

  onPrint(){
    window.print();
  }

  onUpdateInvoices(){
    const oids = this.invoice.invoices.map(order => order.oid);
    this.$order.updateInvoices(oids, this.invoicesAmount).subscribe((result)=>{
      alert("Merci d'avoir effectué le paiement :-)")
    },(status)=> {
      alert(status.error||status.message);
    })
  }


  onClose() {
    this.closed.emit("close");
  }
}
