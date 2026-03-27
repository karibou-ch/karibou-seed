import { Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { ProductComponent } from './product.component';

@Component({
  selector: 'kng-product-view-detailled',
  templateUrl: './product-view-detailled.component.html',
  styleUrls: ['./product.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductViewDetailledComponent {
  @Input() productCtrl: ProductComponent;
  @ViewChild('dialog', { static: true }) dialog: ElementRef;
}
