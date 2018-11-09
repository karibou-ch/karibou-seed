import { Component, OnInit, ViewEncapsulation, HostBinding, Input, ElementRef, ViewChild, EventEmitter, Output, OnDestroy } from '@angular/core';
import { MdcSearchBarComponent } from '../mdc-search-bar/mdc-search-bar.component';
import { Category, ProductService, Product, CartService } from 'kng2-core';

@Component({
  selector: 'kng-ui-bottom-actions',
  templateUrl: './kng-ui-bottom-actions.component.html',
  styleUrls: ['./kng-ui-bottom-actions.component.scss'],
  encapsulation: ViewEncapsulation.None  
})
export class KngUiBottomActionsComponent implements OnInit, OnDestroy {

  @Input() categories:Category[];
  @Input() exited:boolean;
  store:string='geneva';
  show:boolean;
  findGetNull:boolean;
  products:Product[]=[];

  @HostBinding('class.show') get classShow(): boolean {
    return this.show;
  }

  @HostBinding('class.exited') get classExited(): boolean {
    return this.exited;
  }

  @Output() selected:EventEmitter<string>=new EventEmitter<string>();

  @ViewChild('search') search:ElementRef;
  
  constructor(
    private $cart: CartService,
    private $products:ProductService
  ) { }

  ngOnInit() {
    this.categories=this.categories.sort(this.sortByWeight).filter((c,i)=> {
      return c.active&&(c.type==='Category');
    }).sort((b,a)=>b.weight-a.weight);
  }


  ngOnDestroy(){
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  addToCard(product){
    this.$cart.add(new Product(product));
  }

  hasSearch(){
    return this.search.nativeElement.value
  }

  doClear(){
    this.products=[];
    this.search.nativeElement.value='';
  }

  doGoCategory(slug){
    this.selected.emit(slug);
    this.doClear();
    this.show=false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  doInput(value?:string){
    let blur=!value;
    value=value||this.search.nativeElement.value;
    let tokens=value.split(' ').map(val=>(val||'').length);
    // console.log('--search', value, tokens, tokens.every(len=>len>=3))

    //
    // on search open window
    if(tokens.every(len=>len>=3)){
      this.show=true;
      this.findGetNull=false;
      document.body.classList.add('mdc-dialog-scroll-lock');
      this.$products.search(value).subscribe(products=>{
        this.findGetNull=!products.length
        this.products=products;
        blur&&this.search.nativeElement.blur();
      });
    }
  }

  doToggle(){
    this.show=!this.show;
    if(this.show){
      this.products=[];
      document.body.classList.add('mdc-dialog-scroll-lock');
      // this.search.nativeElement.focus();
    } else{
      document.body.classList.remove('mdc-dialog-scroll-lock');
      this.doClear();
    }

  }
  onFocus(){
    try{
      this.search.nativeElement.select();
    }catch(e){}
    
  }

  sortByWeight(a:Category,b:Category){
    return a.weight-b.weight;
  }
    
}
