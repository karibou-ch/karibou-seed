import { ChangeDetectorRef, Component, EventEmitter, Input, Output, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { i18n, KngNavigationStateService } from 'src/app/common';
import { Product, Config, LoaderService } from 'kng2-core';

@Component({
  selector: 'kng-product-link',
  templateUrl: './kng-product-link.component.html',
  styleUrls: ['./kng-product-link.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngProductLinkComponent implements OnInit {


  @Input() config: any;
  @Input() product: Product;
  @Input() hightop: boolean;
  @Output() click: EventEmitter<string> = new EventEmitter<string>();




  constructor(
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $loader: LoaderService
  ) {
    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config } = this.$loader.getLatestCoreData();
    this.config = config;
  }

  get hideIfEmpty() {
    return (!this.product);
  }
  get i18n(){
    return this.$i18n;
  }
  ngOnInit() {
  }


  assistant(link,product){
    const params = {};
    params[link] = product.title;
    this.$router.navigate(['/store',this.$navigation.store,'home','assistant','james'],{queryParams:params});
  }


}
