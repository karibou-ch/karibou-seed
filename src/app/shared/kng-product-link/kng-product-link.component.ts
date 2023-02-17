import { ChangeDetectorRef, Component, EventEmitter, Input, Output, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { i18n, KngNavigationStateService } from 'src/app/common';
import { Shop } from '../../../../../kng2-core/dist';

@Component({
  selector: 'kng-product-link',
  templateUrl: './kng-product-link.component.html',
  styleUrls: ['./kng-product-link.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngProductLinkComponent implements OnInit {


  @Input() config: any;
  @Input() shops: Shop[];
  @Input() links: string[];
  @Input() hightop: boolean;
  @Output() click: EventEmitter<string> = new EventEmitter<string>();

  options = {
    available: true,
    status: true,
    when: true
  };


  constructor(
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef
  ) {
    const loader  = this.$route.snapshot.data.loader ||
                  this.$route.snapshot.parent.data.loader;
    this.config = loader[0];

    const links = this.config.shared.hub.defaultTags;
    this.links = links? links.split(/[,\n]/).filter(el => el!==''):[];

    // this.links.push('shop:casa');
    // this.links.push('tomate');
    // this.links.push('confiture');
    // this.links.push('truffe');
    // this.links.push('chocolat');
  }

  get hideIfEmpty() {
    return (this.links.length == 0);
  }
  get i18n(){
    return this.$i18n;
  }
  ngOnInit() {    
  }


  searchAction(link){
    this.$navigation.searchAction(link);    
    this.click.emit(link)
  }

  trackByShop(index,shop) {
    return shop.urlpath;
  }

}
